-- ════════════════════════════════════════════════════════════════
-- Sorli · Migració 5: administració
--
-- Funcions d'admin SECURITY DEFINER amb salvaguardes:
--   · totes comproven private.is_admin() al principi
--   · un admin no es pot suspendre, degradar ni eliminar a si mateix
--   · sempre ha de quedar com a mínim un admin actiu
-- + check_invitation distingeix usada / caducada / revocada
-- ════════════════════════════════════════════════════════════════

create or replace function private.assert_admin()
returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then
    raise exception 'Només l''administrador pot fer això' using errcode = '42501';
  end if;
end;
$$;

-- ─── Llistat de membres amb correu i darrer accés (només admin) ─
create or replace function public.admin_list_members()
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_path text,
  role public.member_role,
  status public.member_status,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  post_count bigint
)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.assert_admin();
  return query
    select p.id, p.username, p.display_name, p.avatar_path, p.role, p.status,
           u.email::text, p.created_at, u.last_sign_in_at,
           (select count(*) from public.posts po where po.author_id = p.id)
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.created_at;
end;
$$;

-- ─── Suspendre / reactivar ──────────────────────────────────────
create or replace function public.admin_set_member_status(p_user uuid, p_status public.member_status)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_admin();
  if p_user = auth.uid() then
    raise exception 'No et pots suspendre a tu mateix' using errcode = '42501';
  end if;
  if p_status = 'suspended' and exists (
       select 1 from public.profiles where id = p_user and role = 'admin'
     ) and (select count(*) from public.profiles where role = 'admin' and status = 'active') <= 1 then
    raise exception 'Ha de quedar almenys un administrador actiu' using errcode = '42501';
  end if;
  update public.profiles set status = p_status where id = p_user;
  if not found then raise exception 'Membre no trobat' using errcode = 'P0002'; end if;
end;
$$;

-- ─── Canviar rol ────────────────────────────────────────────────
create or replace function public.admin_set_member_role(p_user uuid, p_role public.member_role)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_admin();
  if p_user = auth.uid() then
    raise exception 'No pots canviar el teu propi rol' using errcode = '42501';
  end if;
  update public.profiles set role = p_role where id = p_user;
  if not found then raise exception 'Membre no trobat' using errcode = 'P0002'; end if;
end;
$$;

-- ─── Eliminar un compte (els fitxers de Storage els esborra l'app abans) ─
create or replace function public.admin_delete_member(p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_admin();
  if p_user = auth.uid() then
    raise exception 'Per eliminar el teu compte, fes-ho des d''Ajustos' using errcode = '42501';
  end if;
  if exists (select 1 from public.profiles where id = p_user and role = 'admin' and status = 'active')
     and (select count(*) from public.profiles where role = 'admin' and status = 'active') <= 1 then
    raise exception 'Ha de quedar almenys un administrador actiu' using errcode = '42501';
  end if;
  delete from auth.users where id = p_user;
  if not found then raise exception 'Membre no trobat' using errcode = 'P0002'; end if;
end;
$$;

-- ─── check_invitation: estats més clars per a la pantalla de registre ─
-- 'ok' | 'invalid' | 'used' | 'expired' | 'revoked' | 'email_mismatch' | 'username_taken'
create or replace function public.check_invitation(p_token text, p_email text default null, p_username text default null)
returns text language plpgsql stable security definer set search_path = '' as $$
declare
  v_inv public.invitations;
begin
  select * into v_inv from public.invitations where token_hash = private.hash_token(p_token);
  if not found then return 'invalid'; end if;
  if v_inv.revoked_at is not null then return 'revoked'; end if;
  if v_inv.used_at is not null then return 'used'; end if;
  if v_inv.expires_at <= now() then return 'expired'; end if;
  if p_email is not null and v_inv.email is not null and v_inv.email <> lower(btrim(p_email)) then
    return 'email_mismatch';
  end if;
  if p_username is not null and exists (select 1 from public.profiles where username = lower(btrim(p_username))) then
    return 'username_taken';
  end if;
  return 'ok';
end;
$$;

-- ─── Privilegis ─────────────────────────────────────────────────
revoke all on function private.assert_admin() from public, anon;
grant execute on function private.assert_admin() to authenticated;

revoke all on function public.admin_list_members() from public, anon;
revoke all on function public.admin_set_member_status(uuid, public.member_status) from public, anon;
revoke all on function public.admin_set_member_role(uuid, public.member_role) from public, anon;
revoke all on function public.admin_delete_member(uuid) from public, anon;
grant execute on function public.admin_list_members() to authenticated;
grant execute on function public.admin_set_member_status(uuid, public.member_status) to authenticated;
grant execute on function public.admin_set_member_role(uuid, public.member_role) to authenticated;
grant execute on function public.admin_delete_member(uuid) to authenticated;
