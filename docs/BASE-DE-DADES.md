# Base de dades

Projecte Supabase: `sorli` (`vtietcaydzqqxvwcriqk`, eu-west-3).
Migracions a `supabase/migrations/`, en ordre.

| Migració | Estat |
|---|---|
| `20261126000100_membres_i_invitacions` | ✅ aplicada |
| `20261126000200_funcions_permisos_a_schema_privat` | ✅ aplicada |
| `20261126000300_contingut_social` | ✅ aplicada |
| `20261126000400_contingut_personal` | ✅ aplicada |
| `20261126000500_administracio` | ⏳ pendent de confirmació a Supabase |

## Taules (Fase 2)

### `invitations`
| Columna | Tipus | Notes |
|---|---|---|
| id | uuid PK | |
| token_hash | text únic | SHA-256 del token. El token en clar no es guarda mai |
| email | text null | Si s'informa, només aquest correu la pot fer servir |
| role | member_role | `member` per defecte |
| note | text ≤200 | Per a qui és |
| created_by | uuid → auth.users | |
| expires_at | timestamptz | 7 dies per defecte |
| used_at / used_by | | Sol ús |
| revoked_at | timestamptz | |
| created_at / updated_at | | `updated_at` per trigger |

### `profiles`
| Columna | Tipus | Notes |
|---|---|---|
| id | uuid PK → auth.users | `on delete cascade` |
| username | text únic | `^[a-z0-9_.]{3,20}$`, immutable des del client |
| display_name | text 1-60 | Per defecte = username |
| bio / city / birthday | | Informació personal |
| avatar_path / cover_path | text | Rutes a Storage (Fase 3) |
| role | `admin` \| `member` | |
| status | `active` \| `suspended` | |
| invitation_id | uuid → invitations | |

## Taules (Fase 3)

| Taula | Clau | Notes |
|---|---|---|
| `posts` | id | `author_id` (qui escriu) · `wall_owner_id` (de qui és el mur). Iguals = publicació pròpia |
| `photos` | id | Galeria global: `owner_id` = qui la puja. `storage_path` ha de començar per `<owner_id>/` |
| `post_photos` | (post_id, photo_id) | Referències: el fitxer no es duplica. Esborrar un post NO esborra les fotos de la galeria |
| `comments` | id | `parent_id` per a respostes. Un sol nivell (trigger `check_comment_parent`) |
| `likes` | (post_id, user_id) | La PK fa impossible fer dos m'agrada |
| `notifications` | id | Les creen triggers: `wall_post`, `comment`, `reply`, `like`. No s'insereixen des del client |

## Taules (Fase 4)

| Taula | Notes |
|---|---|
| `wishlist_items` | Una llista per usuari (no hi ha taula `wishlists`). Nom, descripció, enllaç (http/https), foto opcional |
| `songs` | Música actual: títol, artista, enllaç i portada (`cover_url` externa via oEmbed o `cover_path` pujada) |
| `playlists` | Playlists de Spotify: títol i descripció propis, enllaç validat (`open.spotify.com/playlist/…`) i portada via oEmbed |

Totes: lectura per a membres actius; crear, editar i esborrar només el propietari (l'admin també pot esborrar).
Les fotos de la wishlist i les portades pujades van al bucket `photos` (sufix `-wish` / `-cover`), però **no** a la taula `photos`, així que no surten a la galeria.

Storage: buckets **privats** `avatars` (5 MB) i `photos` (8 MB), només imatges. Ruta `<uid>/<uuid>.<ext>`. L'app les serveix via `/media/<bucket>/<ruta>`, que crea una URL signada amb la sessió de l'usuari.

## Funcions

| Funció | Qui la pot cridar | Per a què |
|---|---|---|
| `public.check_invitation(token, email?, username?)` | anon, authenticated | Validació prèvia: `ok`, `invalid`, `email_mismatch` o `username_taken` |
| `public.create_post(wall_owner, body, photo_paths[])` | authenticated (SECURITY INVOKER) | Post + fotos en una transacció, amb RLS |
| `public.delete_my_account()` | authenticated | Esborra el propi usuari (cascada) |
| `public.admin_list_members()` | només admin (comprovat dins) | Membres amb correu, darrer accés i nº de publicacions |
| `public.admin_set_member_status(user, status)` | només admin | Suspendre / reactivar. No a un mateix; sempre queda un admin actiu |
| `public.admin_set_member_role(user, role)` | només admin | Fer / treure admin. No el propi rol |
| `public.admin_delete_member(user)` | només admin | Elimina un compte (cascada). No a un mateix; sempre queda un admin actiu |
| `private.is_active_member()` / `private.is_admin()` | authenticated (no exposades a l'API) | Base de les RLS |
| `private.validate_invitation_on_signup()` / `private.create_profile_on_signup()` | ningú (triggers) | Registre per invitació |
| `private.on_*_created()` / `private.notify()` | ningú (triggers) | Notificacions |

## Crear invitacions

Des del panell **/admin → Invitacions** (l'enllaç només es mostra un cop).

### A mà (emergència, si no hi ha cap admin)

```bash
# 1. genera un token i el seu hash
node -e "const c=require('crypto');const t=c.randomBytes(32).toString('base64url');console.log(t);console.log(c.createHash('sha256').update(t).digest('hex'))"
```
```sql
-- 2. al SQL Editor de Supabase, amb el hash (2a línia)
insert into public.invitations (token_hash, note) values ('<hash>', 'Per a la Marta');
```
3. Enllaç: `<SITE_URL>/registre/<token>` (1a línia).

## Tipus TypeScript

`npm run db:types` (requereix `npx supabase login`).
