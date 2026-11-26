-- ════════════════════════════════════════════════════════════════
-- Sorli · Migració 3: contingut social
-- posts · comments · likes · photos · post_photos · notifications
-- + Storage (buckets privats `avatars` i `photos`)
-- + eliminar el propi compte
-- ════════════════════════════════════════════════════════════════

-- ─── photos (galeria global: cada foto és de qui la puja) ───────
create table public.photos (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles (id) on delete cascade,
  storage_path  text not null unique,
  created_at    timestamptz not null default now(),
  -- la ruta ha de ser dins la carpeta de l'usuari: <owner_id>/...
  constraint photos_path_in_owner_folder
    check (split_part(storage_path, '/', 1) = owner_id::text)
);
create index photos_owner_created_idx on public.photos (owner_id, created_at desc);

-- ─── posts ──────────────────────────────────────────────────────
-- author_id = qui escriu · wall_owner_id = de qui és el mur.
-- Si són iguals, és una publicació pròpia.
create table public.posts (
  id             uuid primary key default gen_random_uuid(),
  author_id      uuid not null references public.profiles (id) on delete cascade,
  wall_owner_id  uuid not null references public.profiles (id) on delete cascade,
  body           text not null default '' check (char_length(body) <= 5000),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index posts_created_idx on public.posts (created_at desc);
create index posts_wall_created_idx on public.posts (wall_owner_id, created_at desc);
create index posts_author_idx on public.posts (author_id);

create trigger posts_set_updated_at before update on public.posts
  for each row execute function public.set_updated_at();

-- ─── post_photos (referències: el fitxer no es duplica mai) ─────
create table public.post_photos (
  post_id   uuid not null references public.posts (id) on delete cascade,
  photo_id  uuid not null references public.photos (id) on delete cascade,
  position  smallint not null default 0 check (position between 0 and 19),
  primary key (post_id, photo_id)
);
create index post_photos_photo_idx on public.post_photos (photo_id);

-- ─── comments (un sol nivell de respostes) ──────────────────────
create table public.comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts (id) on delete cascade,
  author_id   uuid not null references public.profiles (id) on delete cascade,
  parent_id   uuid references public.comments (id) on delete cascade,
  body        text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index comments_post_created_idx on public.comments (post_id, created_at);
create index comments_parent_idx on public.comments (parent_id);
create index comments_author_idx on public.comments (author_id);

create trigger comments_set_updated_at before update on public.comments
  for each row execute function public.set_updated_at();

-- Una resposta només pot penjar d'un comentari de primer nivell del mateix post.
create or replace function private.check_comment_parent()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_parent public.comments;
begin
  if new.parent_id is null then return new; end if;
  select * into v_parent from public.comments where id = new.parent_id;
  if v_parent.post_id <> new.post_id then
    raise exception 'La resposta ha de ser del mateix post' using errcode = '23514';
  end if;
  if v_parent.parent_id is not null then
    raise exception 'Només es permet un nivell de respostes' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger comments_check_parent before insert or update of parent_id on public.comments
  for each row execute function private.check_comment_parent();

-- ─── likes (una per persona i publicació: PK composta) ──────────
create table public.likes (
  post_id     uuid not null references public.posts (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index likes_user_idx on public.likes (user_id);

-- ─── notifications (dins l'app, creades per triggers) ───────────
create type public.notification_type as enum ('wall_post', 'comment', 'reply', 'like');

create table public.notifications (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  uuid not null references public.profiles (id) on delete cascade,
  actor_id      uuid not null references public.profiles (id) on delete cascade,
  type          public.notification_type not null,
  post_id       uuid references public.posts (id) on delete cascade,
  comment_id    uuid references public.comments (id) on delete cascade,
  read_at       timestamptz,
  created_at    timestamptz not null default now(),
  check (recipient_id <> actor_id)
);
create index notifications_recipient_idx on public.notifications (recipient_id, created_at desc);
create index notifications_unread_idx on public.notifications (recipient_id) where read_at is null;

create or replace function private.notify(
  p_recipient uuid, p_actor uuid, p_type public.notification_type,
  p_post uuid, p_comment uuid default null
) returns void language sql security definer set search_path = '' as $$
  insert into public.notifications (recipient_id, actor_id, type, post_id, comment_id)
  select p_recipient, p_actor, p_type, p_post, p_comment
  where p_recipient is not null and p_recipient <> p_actor;
$$;

create or replace function private.on_post_created()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform private.notify(new.wall_owner_id, new.author_id, 'wall_post', new.id);
  return new;
end;
$$;

create or replace function private.on_comment_created()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_post          public.posts;
  v_parent_author uuid;
begin
  select * into v_post from public.posts where id = new.post_id;

  if new.parent_id is not null then
    select author_id into v_parent_author from public.comments where id = new.parent_id;
    perform private.notify(v_parent_author, new.author_id, 'reply', new.post_id, new.id);
  end if;

  -- autor del post i propietari del mur (sense duplicar destinataris)
  if v_post.author_id is distinct from v_parent_author then
    perform private.notify(v_post.author_id, new.author_id, 'comment', new.post_id, new.id);
  end if;
  if v_post.wall_owner_id <> v_post.author_id
     and v_post.wall_owner_id is distinct from v_parent_author then
    perform private.notify(v_post.wall_owner_id, new.author_id, 'comment', new.post_id, new.id);
  end if;
  return new;
end;
$$;

create or replace function private.on_like_created()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_author uuid;
begin
  select author_id into v_author from public.posts where id = new.post_id;
  -- evita repetir la notificació si algú fa i desfà m'agrada
  if not exists (
    select 1 from public.notifications
    where recipient_id = v_author and actor_id = new.user_id
      and type = 'like' and post_id = new.post_id
  ) then
    perform private.notify(v_author, new.user_id, 'like', new.post_id);
  end if;
  return new;
end;
$$;

create trigger posts_notify after insert on public.posts
  for each row execute function private.on_post_created();
create trigger comments_notify after insert on public.comments
  for each row execute function private.on_comment_created();
create trigger likes_notify after insert on public.likes
  for each row execute function private.on_like_created();

-- ─── RPC: crear una publicació amb fotos en UNA transacció ──────
-- SECURITY INVOKER: s'hi apliquen totes les RLS de l'usuari.
create or replace function public.create_post(
  p_wall_owner_id uuid,
  p_body          text,
  p_photo_paths   text[] default '{}'
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_post_id  uuid;
  v_photo_id uuid;
  v_i        int := 0;
  v_path     text;
begin
  if coalesce(btrim(p_body), '') = '' and coalesce(cardinality(p_photo_paths), 0) = 0 then
    raise exception 'La publicació no pot estar buida' using errcode = '23514';
  end if;
  if coalesce(cardinality(p_photo_paths), 0) > 10 then
    raise exception 'Màxim 10 fotos per publicació' using errcode = '23514';
  end if;

  insert into public.posts (author_id, wall_owner_id, body)
  values (auth.uid(), p_wall_owner_id, coalesce(btrim(p_body), ''))
  returning id into v_post_id;

  foreach v_path in array coalesce(p_photo_paths, '{}') loop
    insert into public.photos (owner_id, storage_path)
    values (auth.uid(), v_path)
    returning id into v_photo_id;

    insert into public.post_photos (post_id, photo_id, position)
    values (v_post_id, v_photo_id, v_i);
    v_i := v_i + 1;
  end loop;

  return v_post_id;
end;
$$;

-- ─── RPC: eliminar el propi compte ──────────────────────────────
-- Esborra l'usuari d'Auth → cascada a profiles i tot el seu contingut.
-- (Els fitxers de Storage els esborra l'app abans de cridar-la.)
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'Cal iniciar sessió' using errcode = '42501';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

-- ─── Privilegis ─────────────────────────────────────────────────
revoke all on public.posts, public.post_photos, public.comments, public.likes,
              public.photos, public.notifications from anon, authenticated;

grant select, insert, delete on public.posts to authenticated;
grant update (body) on public.posts to authenticated;
grant select, insert, delete on public.post_photos to authenticated;
grant select, insert, delete on public.comments to authenticated;
grant update (body) on public.comments to authenticated;
grant select, insert, delete on public.likes to authenticated;
grant select, insert, delete on public.photos to authenticated;
grant select, delete on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

revoke all on function public.create_post(uuid, text, text[]) from public, anon;
grant execute on function public.create_post(uuid, text, text[]) to authenticated;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
revoke all on function private.notify(uuid, uuid, public.notification_type, uuid, uuid) from public, anon, authenticated;
revoke all on function private.on_post_created() from public, anon, authenticated;
revoke all on function private.on_comment_created() from public, anon, authenticated;
revoke all on function private.on_like_created() from public, anon, authenticated;
revoke all on function private.check_comment_parent() from public, anon, authenticated;

-- ─── RLS ────────────────────────────────────────────────────────
alter table public.photos        enable row level security;
alter table public.posts         enable row level security;
alter table public.post_photos   enable row level security;
alter table public.comments      enable row level security;
alter table public.likes         enable row level security;
alter table public.notifications enable row level security;

-- Membre actiu i, per escriure, sempre en nom propi.
-- photos
create policy "Membres veuen fotos" on public.photos for select to authenticated
  using ((select private.is_active_member()));
create policy "Membre puja fotos pròpies" on public.photos for insert to authenticated
  with check (owner_id = (select auth.uid()) and (select private.is_active_member()));
create policy "Propietari o admin esborra fotos" on public.photos for delete to authenticated
  using (owner_id = (select auth.uid()) or (select private.is_admin()));

-- posts
create policy "Membres veuen publicacions" on public.posts for select to authenticated
  using ((select private.is_active_member()));
create policy "Membre publica en nom propi a murs de membres actius" on public.posts for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and (select private.is_active_member())
    and exists (select 1 from public.profiles p where p.id = wall_owner_id and p.status = 'active')
  );
create policy "Autor edita la seva publicació" on public.posts for update to authenticated
  using (author_id = (select auth.uid()) and (select private.is_active_member()))
  with check (author_id = (select auth.uid()));
create policy "Autor, propietari del mur o admin esborra" on public.posts for delete to authenticated
  using (
    author_id = (select auth.uid())
    or wall_owner_id = (select auth.uid())
    or (select private.is_admin())
  );

-- post_photos
create policy "Membres veuen fotos de publicacions" on public.post_photos for select to authenticated
  using ((select private.is_active_member()));
create policy "Autor enllaça fotos seves als seus posts" on public.post_photos for insert to authenticated
  with check (
    (select private.is_active_member())
    and exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid()))
    and exists (select 1 from public.photos f where f.id = photo_id and f.owner_id = (select auth.uid()))
  );
create policy "Autor del post desenllaça fotos" on public.post_photos for delete to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid())));

-- comments
create policy "Membres veuen comentaris" on public.comments for select to authenticated
  using ((select private.is_active_member()));
create policy "Membre comenta en nom propi" on public.comments for insert to authenticated
  with check (author_id = (select auth.uid()) and (select private.is_active_member()));
create policy "Autor edita el seu comentari" on public.comments for update to authenticated
  using (author_id = (select auth.uid()) and (select private.is_active_member()))
  with check (author_id = (select auth.uid()));
create policy "Autor, propietari del mur o admin esborra comentaris" on public.comments for delete to authenticated
  using (
    author_id = (select auth.uid())
    or exists (select 1 from public.posts p where p.id = post_id and p.wall_owner_id = (select auth.uid()))
    or (select private.is_admin())
  );

-- likes
create policy "Membres veuen m'agrades" on public.likes for select to authenticated
  using ((select private.is_active_member()));
create policy "Membre fa m'agrada en nom propi" on public.likes for insert to authenticated
  with check (user_id = (select auth.uid()) and (select private.is_active_member()));
create policy "Membre desfà el seu m'agrada" on public.likes for delete to authenticated
  using (user_id = (select auth.uid()));

-- notifications (només les teves)
create policy "Veus les teves notificacions" on public.notifications for select to authenticated
  using (recipient_id = (select auth.uid()));
create policy "Marques les teves com a llegides" on public.notifications for update to authenticated
  using (recipient_id = (select auth.uid())) with check (recipient_id = (select auth.uid()));
create policy "Esborres les teves notificacions" on public.notifications for delete to authenticated
  using (recipient_id = (select auth.uid()));

-- ─── Storage: buckets PRIVATS (res públic sense sessió) ─────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('photos',  'photos',  false, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

-- Llegir: qualsevol membre actiu. Escriure/esborrar: només a la carpeta pròpia <uid>/...
create policy "Sorli: membres llegeixen imatges" on storage.objects for select to authenticated
  using (bucket_id in ('avatars', 'photos') and (select private.is_active_member()));

create policy "Sorli: membre puja a la seva carpeta" on storage.objects for insert to authenticated
  with check (
    bucket_id in ('avatars', 'photos')
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select private.is_active_member())
  );

create policy "Sorli: membre actualitza la seva carpeta" on storage.objects for update to authenticated
  using (bucket_id in ('avatars', 'photos') and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id in ('avatars', 'photos') and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Sorli: membre o admin esborra" on storage.objects for delete to authenticated
  using (
    bucket_id in ('avatars', 'photos')
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.is_admin()))
  );
