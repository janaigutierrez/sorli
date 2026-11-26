-- ════════════════════════════════════════════════════════════════
-- Sorli · Migració 2: funcions de permisos fora de l'API pública
--
-- L'advisor de Supabase avisa que is_active_member / is_admin són
-- cridables via /rest/v1/rpc. No és perillós, però no cal exposar-les.
-- Les movem a un schema `private` (no exposat) i hi apuntem les RLS.
-- check_invitation es queda a public A PROPÒSIT (vegeu el comentari).
-- ════════════════════════════════════════════════════════════════

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

alter function public.is_active_member() set schema private;
alter function public.is_admin() set schema private;
alter function public.validate_invitation_on_signup() set schema private;
alter function public.create_profile_on_signup() set schema private;
alter function public.hash_token(text) set schema private;

create or replace function public.check_invitation(
  p_token text, p_email text default null, p_username text default null
)
returns text language plpgsql stable security definer set search_path = '' as $$
declare
  v_inv public.invitations;
begin
  select * into v_inv from public.invitations
  where token_hash = private.hash_token(p_token)
    and used_at is null and revoked_at is null and expires_at > now();
  if not found then return 'invalid'; end if;
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

create or replace function private.validate_invitation_on_signup()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_token    text := new.raw_user_meta_data ->> 'invitation_token';
  v_username text := lower(btrim(coalesce(new.raw_user_meta_data ->> 'username', '')));
  v_inv      public.invitations;
begin
  if v_token is null or v_token = '' then
    raise exception 'SORLI_INVITATION_REQUIRED' using errcode = 'P0001';
  end if;
  select * into v_inv from public.invitations
  where token_hash = private.hash_token(v_token) for update;
  if not found or v_inv.used_at is not null or v_inv.revoked_at is not null
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

revoke all on function private.hash_token(text) from public, anon, authenticated;
revoke all on function private.validate_invitation_on_signup() from public, anon, authenticated;
revoke all on function private.create_profile_on_signup() from public, anon, authenticated;
grant execute on function private.is_active_member() to authenticated;
grant execute on function private.is_admin() to authenticated;

-- Les polítiques ja apunten a les funcions per OID (segueixen funcionant),
-- però les recreem perquè el SQL que es llegeix coincideixi amb la realitat.
drop policy "Membres actius veuen tots els perfils" on public.profiles;
drop policy "Cada membre edita el seu perfil" on public.profiles;
drop policy "Admin veu invitacions" on public.invitations;
drop policy "Admin crea invitacions" on public.invitations;
drop policy "Admin revoca invitacions" on public.invitations;

create policy "Membres actius veuen tots els perfils"
  on public.profiles for select to authenticated
  using ((select private.is_active_member()) or id = (select auth.uid()));

create policy "Cada membre edita el seu perfil"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()) and (select private.is_active_member()))
  with check (id = (select auth.uid()));

create policy "Admin veu invitacions"
  on public.invitations for select to authenticated
  using ((select private.is_admin()));

create policy "Admin crea invitacions"
  on public.invitations for insert to authenticated
  with check ((select private.is_admin()) and created_by = (select auth.uid()));

create policy "Admin revoca invitacions"
  on public.invitations for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

comment on function public.check_invitation(text, text, text) is
  'Exposada a anon A PROPÒSIT: valida un token abans del registre per donar errors clars. Sense un token vàlid (256 bits) no revela res.';
