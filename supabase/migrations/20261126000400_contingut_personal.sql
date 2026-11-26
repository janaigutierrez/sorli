-- ════════════════════════════════════════════════════════════════
-- Sorli · Migració 4: contingut personal
-- wishlist_items · songs · playlists
--
-- Decisió: UNA wishlist per usuari → no hi ha taula `wishlists`;
-- els elements pengen directament del perfil.
-- ════════════════════════════════════════════════════════════════

-- URL http(s) raonable (la validació fina es fa a l'app amb zod)
create or replace function private.is_http_url(p text)
returns boolean language sql immutable set search_path = '' as $$
  select p ~* '^https?://[^\s/$.?#].[^\s]*$' and char_length(p) <= 2000;
$$;

-- ─── wishlist_items ─────────────────────────────────────────────
create table public.wishlist_items (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles (id) on delete cascade,
  name         text not null check (char_length(btrim(name)) between 1 and 120),
  description  text check (char_length(description) <= 500),
  url          text check (url is null or private.is_http_url(url)),
  image_path   text check (image_path is null or split_part(image_path, '/', 1) = owner_id::text),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index wishlist_items_owner_idx on public.wishlist_items (owner_id, created_at desc);
create trigger wishlist_items_set_updated_at before update on public.wishlist_items
  for each row execute function public.set_updated_at();

-- ─── songs (música actual) ──────────────────────────────────────
create table public.songs (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles (id) on delete cascade,
  title       text not null check (char_length(btrim(title)) between 1 and 150),
  artist      text not null check (char_length(btrim(artist)) between 1 and 150),
  url         text not null check (private.is_http_url(url)),
  -- portada: o bé externa (Spotify/YouTube via oEmbed) o bé pujada a Storage
  cover_url   text check (cover_url is null or private.is_http_url(cover_url)),
  cover_path  text check (cover_path is null or split_part(cover_path, '/', 1) = owner_id::text),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index songs_owner_idx on public.songs (owner_id, created_at desc);
create trigger songs_set_updated_at before update on public.songs
  for each row execute function public.set_updated_at();

-- ─── playlists (de Spotify, sense connectar comptes) ────────────
create table public.playlists (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles (id) on delete cascade,
  title        text not null check (char_length(btrim(title)) between 1 and 120),
  description  text check (char_length(description) <= 500),
  spotify_url  text not null
               check (spotify_url ~ '^https://open\.spotify\.com/(intl-[a-z]{2}/)?playlist/[A-Za-z0-9]{10,40}'),
  cover_url    text check (cover_url is null or private.is_http_url(cover_url)),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index playlists_owner_idx on public.playlists (owner_id, created_at desc);
create trigger playlists_set_updated_at before update on public.playlists
  for each row execute function public.set_updated_at();

-- ─── Privilegis ─────────────────────────────────────────────────
revoke all on public.wishlist_items, public.songs, public.playlists from anon, authenticated;
grant select, insert, update, delete on public.wishlist_items, public.songs, public.playlists to authenticated;
-- is_http_url s'usa en CHECKs: la deixem executable per a authenticated (és pura i inofensiva)
revoke all on function private.is_http_url(text) from public, anon;
grant execute on function private.is_http_url(text) to authenticated;

-- ─── RLS: tots els membres ho veuen; només el propietari ho toca ─
alter table public.wishlist_items enable row level security;
alter table public.songs          enable row level security;
alter table public.playlists      enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['wishlist_items', 'songs', 'playlists'] loop
    execute format($f$
      create policy "Membres veuen %1$s" on public.%1$I for select to authenticated
        using ((select private.is_active_member()));
      create policy "Propietari crea %1$s" on public.%1$I for insert to authenticated
        with check (owner_id = (select auth.uid()) and (select private.is_active_member()));
      create policy "Propietari edita %1$s" on public.%1$I for update to authenticated
        using (owner_id = (select auth.uid()) and (select private.is_active_member()))
        with check (owner_id = (select auth.uid()));
      create policy "Propietari o admin esborra %1$s" on public.%1$I for delete to authenticated
        using (owner_id = (select auth.uid()) or (select private.is_admin()));
    $f$, t);
  end loop;
end;
$$;
