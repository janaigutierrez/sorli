# Base de dades

Projecte Supabase: `sorli` (`vtietcaydzqqxvwcriqk`, eu-west-3).
Migracions a `supabase/migrations/`, en ordre.

| Migració | Estat |
|---|---|
| `20261126000100_membres_i_invitacions` | ✅ aplicada |
| `20261126000200_funcions_permisos_a_schema_privat` | ⏳ pendent (cal confirmar-la, conté `drop policy`) |

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

## Funcions

| Funció | Qui la pot cridar | Per a què |
|---|---|---|
| `check_invitation(token, email?, username?)` | anon, authenticated | Validació prèvia: `ok`, `invalid`, `email_mismatch` o `username_taken` |
| `is_active_member()` / `is_admin()` | authenticated | Base de les RLS |
| `validate_invitation_on_signup()` / `create_profile_on_signup()` | ningú (triggers) | Registre per invitació |

## Crear una invitació a mà (fins al panell d'admin, Fase 5)

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
