-- ════════════════════════════════════════════════════════════════
-- Sorli · Migració 1: membres i invitacions
--
-- Principi: UNA INVITACIÓ VÀLIDA = ACCÉS A LA COMUNITAT.
-- La invitació es valida DINS de Postgres (trigger sobre auth.users),
-- de manera que és impossible crear un compte sense invitació,
-- encara que algú cridi l'API d'Auth directament amb la clau pública.
-- ════════════════════════════════════════════════════════════════

-- ─── Tipus ──────────────────────────────────────────────────────
create type public.member_role as enum ('admin', 'member');
create type public.member_status as enum ('active', 'suspended');

-- ─── Utilitat: updated_at automàtic ─────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ─── Hash de tokens (mai guardem el token en clar) ──────────────
create or replace function public.hash_token(p_token text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
$$;

-- ─── invitations ────────────────────────────────────────────────
create table public.invitations (
  id          uuid primary key default gen_random_uuid(),
  token_hash  text not null unique,
  email       text check (email is null or email = lower(email)),
  role        public.member_role not null default 'member',
  note        text check (char_length(note) <= 200),
  created_by  uuid references auth.users (id) on delete set null,
  expires_at  timestamptz not null default (now() + interval '7 days'),
  used_at     timestamptz,
  used_by     uuid references auth.users (id) on delete set null,
  revoked_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.invitations is
  'Invitacions d''un sol ús. Només es guarda el hash SHA-256 del token.';

create index invitations_created_at_idx on public.invitations (created_at desc);

create trigger invitations_set_updated_at
  before update on public.invitations
  for each row execute function public.set_updated_at();

-- ─── profiles ───────────────────────────────────────────────────
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  username      text not null unique
                  check (username ~ '^[a-z0-9_.]{3,20}$'),
  display_name  text not null
                  check (char_length(btrim(display_name)) between 1 and 60),
  bio           text check (char_length(bio) <= 500),
  city          text check (char_length(city) <= 80),
  birthday      date,
  avatar_path   text,
  cover_path    text,
  role          public.member_role not null default 'member',
  status        public.member_status not null default 'active',
  invitation_id uuid references public.invitations (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.profiles is
  'Un perfil per usuari d''Auth. La pertinença a Sorli = perfil amb status active.';

create index profiles_display_name_idx on public.profiles (lower(display_name));

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ─── Funcions de permisos (base de TOTES les RLS) ───────────────
-- SECURITY DEFINER per poder llegir profiles sense recursió de RLS.
create or replace function public.is_active_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'active'
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'active' and role = 'admin'
  );
$$;

-- ─── Validació prèvia d'una invitació (per donar errors clars) ──
-- Retorna: 'ok' | 'invalid' | 'email_mismatch' | 'username_taken'
-- Cridable sense sessió: sense un token vàlid de 256 bits no revela res.
create or replace function public.check_invitation(
  p_token    text,
  p_email    text default null,
  p_username text default null
)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_inv public.invitations;
begin
  select * into v_inv
  from public.invitations
  where token_hash = public.hash_token(p_token)
    and used_at is null
    and revoked_at is null
    and expires_at > now();

  if not found then
    return 'invalid';
  end if;

  if p_email is not null and v_inv.email is not null
     and v_inv.email <> lower(btrim(p_email)) then
    return 'email_mismatch';
  end if;

  if p_username is not null and exists (
    select 1 from public.profiles where username = lower(btrim(p_username))
  ) then
    return 'username_taken';
  end if;

  return 'ok';
end;
$$;

-- ─── Triggers sobre auth.users: el cor del registre per invitació ─
-- BEFORE: valida i bloqueja la invitació; treu el token de les metadades
--         editables per l'usuari i guarda l'id a app_metadata (no editable).
create or replace function public.validate_invitation_on_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token    text := new.raw_user_meta_data ->> 'invitation_token';
  v_username text := lower(btrim(coalesce(new.raw_user_meta_data ->> 'username', '')));
  v_inv      public.invitations;
begin
  if v_token is null or v_token = '' then
    raise exception 'SORLI_INVITATION_REQUIRED' using errcode = 'P0001';
  end if;

  select * into v_inv
  from public.invitations
  where token_hash = public.hash_token(v_token)
  for update;  -- bloqueja: dos registres simultanis no poden usar-la

  if not found
     or v_inv.used_at is not null
     or v_inv.revoked_at is not null
     or v_inv.expires_at <= now() then
    raise exception 'SORLI_INVITATION_INVALID' using errcode = 'P0001';
  end if;

  if v_inv.email is not null and v_inv.email <> lower(new.email) then
    raise exception 'SORLI_INVITATION_EMAIL_MISMATCH' using errcode = 'P0001';
  end if;

  if v_username !~ '^[a-z0-9_.]{3,20}$' then
    raise exception 'SORLI_INVALID_USERNAME' using errcode = 'P0001';
  end if;

  new.raw_user_meta_data :=
    (new.raw_user_meta_data - 'invitation_token') || jsonb_build_object('username', v_username);
  new.raw_app_meta_data :=
    coalesce(new.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('invitation_id', v_inv.id);

  return new;
end;
$$;

-- AFTER: crea el perfil i consumeix la invitació (mateixa transacció).
create or replace function public.create_profile_on_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inv_id   uuid := (new.raw_app_meta_data ->> 'invitation_id')::uuid;
  v_role     public.member_role;
  v_username text := new.raw_user_meta_data ->> 'username';
begin
  update public.invitations
     set used_at = now(), used_by = new.id
   where id = v_inv_id
  returning role into v_role;

  insert into public.profiles (id, username, display_name, role, invitation_id)
  values (new.id, v_username, v_username, coalesce(v_role, 'member'), v_inv_id);

  return new;
end;
$$;

create trigger sorli_validate_invitation
  before insert on auth.users
  for each row execute function public.validate_invitation_on_signup();

create trigger sorli_create_profile
  after insert on auth.users
  for each row execute function public.create_profile_on_signup();

-- ─── Privilegis ─────────────────────────────────────────────────
-- Res per a anon excepte la validació prèvia d'invitació.
revoke all on public.profiles, public.invitations from anon;
revoke all on public.profiles, public.invitations from authenticated;

-- Els membres poden llegir perfils i editar NOMÉS els camps personals.
-- (username, role, status i invitation_id no es poden tocar des del client)
grant select on public.profiles to authenticated;
grant update (display_name, bio, city, birthday, avatar_path, cover_path)
  on public.profiles to authenticated;

-- Invitacions: l'admin les gestiona (la RLS ho restringeix).
grant select, insert, update on public.invitations to authenticated;

revoke all on function public.check_invitation(text, text, text) from public;
grant execute on function public.check_invitation(text, text, text) to anon, authenticated;

revoke all on function public.is_active_member() from public, anon;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_active_member() to authenticated;
grant execute on function public.is_admin() to authenticated;

revoke all on function public.validate_invitation_on_signup() from public, anon, authenticated;
revoke all on function public.create_profile_on_signup() from public, anon, authenticated;

-- ─── RLS ────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.invitations enable row level security;

create policy "Membres actius veuen tots els perfils"
  on public.profiles for select to authenticated
  using ((select public.is_active_member()) or id = (select auth.uid()));

create policy "Cada membre edita el seu perfil"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()) and (select public.is_active_member()))
  with check (id = (select auth.uid()));

create policy "Admin veu invitacions"
  on public.invitations for select to authenticated
  using ((select public.is_admin()));

create policy "Admin crea invitacions"
  on public.invitations for insert to authenticated
  with check ((select public.is_admin()) and created_by = (select auth.uid()));

create policy "Admin revoca invitacions"
  on public.invitations for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
