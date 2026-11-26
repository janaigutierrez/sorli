-- ════════════════════════════════════════════════════════════════
-- Sorli · Proves de seguretat de la base de dades (RLS, triggers, admin)
--
-- Com executar-les: Supabase → SQL Editor → enganxa-ho tot → Run.
-- Tot passa dins una transacció que acaba amb ROLLBACK: NO deixa res.
-- Resultat: una taula amb cada prova i "OK" / "FALLA".
-- ════════════════════════════════════════════════════════════════
begin;

create temp table r(n serial, prova text, esperat text, obtingut text) on commit drop;
grant all on r to authenticated, anon;
grant usage on sequence r_n_seq to authenticated, anon;

-- helper: registra una prova que ha de FALLAR (excepció) o retornar un valor
create or replace function pg_temp.expect_error(p_name text, p_sql text) returns void language plpgsql as $$
begin
  execute p_sql;
  insert into r(prova, esperat, obtingut) values (p_name, 'error', 'ha entrat!');
exception when others then
  insert into r(prova, esperat, obtingut) values (p_name, 'error', 'error');
end; $$;
create or replace function pg_temp.expect(p_name text, p_expected text, p_sql text) returns void language plpgsql as $$
declare v text;
begin
  execute p_sql into v;
  insert into r(prova, esperat, obtingut) values (p_name, p_expected, coalesce(v, 'NULL'));
exception when others then
  insert into r(prova, esperat, obtingut) values (p_name, p_expected, 'EXCEPCIÓ: ' || sqlerrm);
end; $$;
grant execute on function pg_temp.expect_error(text, text), pg_temp.expect(text, text, text) to authenticated, anon;

-- ─── Dades: un admin (A) i un membre (B) creats amb invitació ────
insert into public.invitations (token_hash, role) values
  (encode(sha256('test-admin'::bytea), 'hex'), 'admin'),
  (encode(sha256('test-membre'::bytea), 'hex'), 'member'),
  (encode(sha256('test-revocada'::bytea), 'hex'), 'member');
update public.invitations set revoked_at = now() where token_hash = encode(sha256('test-revocada'::bytea), 'hex');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, raw_user_meta_data, created_at, updated_at) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@test.cat', 'x', '{"invitation_token":"test-admin","username":"test_a"}', now(), now()),
  ('bbbbbbbb-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@test.cat', 'x', '{"invitation_token":"test-membre","username":"test_b"}', now(), now());

-- ─── Registre per invitació ──────────────────────────────────────
select pg_temp.expect('perfil creat amb rol de la invitació', 'admin', $q$select role::text from public.profiles where username = 'test_a'$q$);
select pg_temp.expect('el token no queda a les metadades', 'false', $q$select (raw_user_meta_data ? 'invitation_token')::text from auth.users where email = 'a@test.cat'$q$);
select pg_temp.expect('check_invitation: usada', 'used', $q$select public.check_invitation('test-membre')$q$);
select pg_temp.expect('check_invitation: revocada', 'revoked', $q$select public.check_invitation('test-revocada')$q$);
select pg_temp.expect('check_invitation: inventada', 'invalid', $q$select public.check_invitation('no-existeix-aquest-token')$q$);
select pg_temp.expect_error('alta sense invitació', $q$insert into auth.users (id, instance_id, aud, role, email, encrypted_password, raw_user_meta_data, created_at, updated_at) values (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'intrus@test.cat', 'x', '{"username":"intrus"}', now(), now())$q$);
select pg_temp.expect_error('alta reutilitzant invitació', $q$insert into auth.users (id, instance_id, aud, role, email, encrypted_password, raw_user_meta_data, created_at, updated_at) values (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'c@test.cat', 'x', '{"invitation_token":"test-membre","username":"test_c"}', now(), now())$q$);
select pg_temp.expect_error('alta amb invitació revocada', $q$insert into auth.users (id, instance_id, aud, role, email, encrypted_password, raw_user_meta_data, created_at, updated_at) values (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'd@test.cat', 'x', '{"invitation_token":"test-revocada","username":"test_d"}', now(), now())$q$);

-- ─── Sense sessió (anon): no pot llegir res ─────────────────────
set local role anon;
select pg_temp.expect_error('anon llegeix perfils', 'select * from public.profiles');
select pg_temp.expect_error('anon llegeix publicacions', 'select * from public.posts');
reset role;

-- ─── Com a membre B ─────────────────────────────────────────────
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-00000000000b","role":"authenticated"}', true);

select pg_temp.expect('B publica al mur d''A amb foto', 'ok', $q$select case when public.create_post('aaaaaaaa-0000-0000-0000-00000000000a', 'Hola!', array['bbbbbbbb-0000-0000-0000-00000000000b/f.webp']) is not null then 'ok' end$q$);
select pg_temp.expect_error('B publica en nom d''A', $q$insert into public.posts (author_id, wall_owner_id, body) values ('aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-00000000000a', 'suplantació')$q$);
select pg_temp.expect_error('B registra foto a carpeta d''A', $q$select public.create_post('aaaaaaaa-0000-0000-0000-00000000000a', 'x', array['aaaaaaaa-0000-0000-0000-00000000000a/f.webp'])$q$);
select pg_temp.expect_error('publicació buida', $q$select public.create_post('aaaaaaaa-0000-0000-0000-00000000000a', '  ', '{}')$q$);
select pg_temp.expect_error('B es fa admin editant el perfil', $q$update public.profiles set role = 'admin' where id = 'bbbbbbbb-0000-0000-0000-00000000000b'$q$);
select pg_temp.expect('B edita la seva bio', 'hola', $q$update public.profiles set bio = 'hola' where id = 'bbbbbbbb-0000-0000-0000-00000000000b' returning bio$q$);
select pg_temp.expect('B no pot editar el perfil d''A (0 files)', '0', $q$with u as (update public.profiles set bio = 'hack' where id = 'aaaaaaaa-0000-0000-0000-00000000000a' returning 1) select count(*)::text from u$q$);
select pg_temp.expect('B no veu invitacions', '0', $q$select count(*)::text from public.invitations$q$);
select pg_temp.expect_error('B crida funció d''admin', $q$select public.admin_list_members()$q$);
select pg_temp.expect_error('wishlist amb enllaç javascript:', $q$insert into public.wishlist_items (owner_id, name, url) values ('bbbbbbbb-0000-0000-0000-00000000000b', 'x', 'javascript:alert(1)')$q$);
select pg_temp.expect_error('playlist que no és de Spotify', $q$insert into public.playlists (owner_id, title, spotify_url) values ('bbbbbbbb-0000-0000-0000-00000000000b', 'x', 'https://evil.com/playlist/37i9dQZF1DX76Wlfdnj7AP')$q$);

-- ─── Com a admin A: m'agrada, comentaris, notificacions ─────────
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select pg_temp.expect('A té notificació de mur', 'wall_post', $q$select string_agg(type::text, ',') from public.notifications$q$);
select pg_temp.expect('A fa m''agrada', '1', $q$with i as (insert into public.likes (post_id, user_id) select id, 'aaaaaaaa-0000-0000-0000-00000000000a' from public.posts where wall_owner_id = 'aaaaaaaa-0000-0000-0000-00000000000a' limit 1 returning 1) select count(*)::text from i$q$);
select pg_temp.expect_error('m''agrada doble', $q$insert into public.likes (post_id, user_id) select id, 'aaaaaaaa-0000-0000-0000-00000000000a' from public.posts where wall_owner_id = 'aaaaaaaa-0000-0000-0000-00000000000a' limit 1$q$);
select pg_temp.expect('A comenta', '1', $q$with i as (insert into public.comments (id, post_id, author_id, body) select 'cccccccc-0000-0000-0000-000000000001', id, 'aaaaaaaa-0000-0000-0000-00000000000a', 'Gràcies' from public.posts where wall_owner_id = 'aaaaaaaa-0000-0000-0000-00000000000a' limit 1 returning 1) select count(*)::text from i$q$);
select pg_temp.expect('A respon (1r nivell)', '1', $q$with i as (insert into public.comments (id, post_id, author_id, parent_id, body) select 'cccccccc-0000-0000-0000-000000000002', post_id, author_id, id, 'resposta' from public.comments where id = 'cccccccc-0000-0000-0000-000000000001' returning 1) select count(*)::text from i$q$);
select pg_temp.expect_error('resposta de 2n nivell', $q$insert into public.comments (post_id, author_id, parent_id, body) select post_id, author_id, id, 'x' from public.comments where id = 'cccccccc-0000-0000-0000-000000000002'$q$);
select pg_temp.expect_error('reassignar una notificació', $q$update public.notifications set recipient_id = 'bbbbbbbb-0000-0000-0000-00000000000b'$q$);

-- ─── Admin ──────────────────────────────────────────────────────
select pg_temp.expect('admin veu membres amb correu', '2', $q$select count(*)::text from public.admin_list_members() where email like '%@test.cat'$q$);
select pg_temp.expect_error('admin es suspèn a si mateix', $q$select public.admin_set_member_status('aaaaaaaa-0000-0000-0000-00000000000a', 'suspended')$q$);
select pg_temp.expect_error('admin s''elimina a si mateix', $q$select public.admin_delete_member('aaaaaaaa-0000-0000-0000-00000000000a')$q$);
select pg_temp.expect('admin suspèn B', 'ok', $q$select 'ok' from (select public.admin_set_member_status('bbbbbbbb-0000-0000-0000-00000000000b', 'suspended')) x$q$);
select pg_temp.expect('B queda suspès', 'suspended', $q$select status::text from public.profiles where id = 'bbbbbbbb-0000-0000-0000-00000000000b'$q$);

-- ─── B suspès: no veu res ───────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select pg_temp.expect('suspès no veu publicacions', '0', $q$select count(*)::text from public.posts$q$);
select pg_temp.expect_error('suspès no pot publicar', $q$select public.create_post('bbbbbbbb-0000-0000-0000-00000000000b', 'hola', '{}')$q$);

reset role;

select n, prova, esperat, obtingut,
       case when esperat = obtingut then 'OK' else 'FALLA' end as resultat
from r order by n;

rollback;
