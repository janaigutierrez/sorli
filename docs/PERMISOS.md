# Permisos i seguretat

## Model

**Una invitació vàlida = accés a la comunitat.** No hi ha amistats: tot membre actiu veu el contingut de tots els membres.

| Concepte | On viu |
|---|---|
| És membre? | `profiles.status = 'active'` → `is_active_member()` |
| És admin? | `profiles.role = 'admin'` i actiu → `is_admin()` |

Totes les polítiques RLS es basen en aquestes dues funcions. Si algun dia cal més granularitat (p. ex. contingut privat), es canvien les funcions o les polítiques sense tocar l'app.

## Registre per invitació (sense clau secreta)

1. L'admin crea una invitació. A la BD només es guarda el **hash SHA-256** del token.
2. L'enllaç `/registre/<token>` crida `check_invitation()` per mostrar errors clars.
3. El formulari fa `supabase.auth.signUp()` amb el token a les metadades.
4. Dins de la mateixa transacció d'Auth:
   - **trigger BEFORE** a `auth.users`: valida el token (existeix, no usat, no revocat, no caducat, correu coincident si n'hi ha), el **bloqueja** (`FOR UPDATE`) i l'esborra de les metadades;
   - **trigger AFTER**: crea el `profile` amb el rol de la invitació i la marca com a usada.
5. Si alguna cosa falla, Postgres desfà l'alta sencera: **no pot existir cap compte sense invitació**, encara que algú cridi l'API d'Auth directament amb la clau pública.

> ⚠️ Per això, a Supabase **"Allow new users to sign up" ha d'estar activat**: l'interruptor no protegeix res aquí (ho fa el trigger) i, si està desactivat, bloqueja també els registres amb invitació.

## Privilegis per taula

| Taula | anon | authenticated |
|---|---|---|
| `profiles` | res | `SELECT` (si és membre actiu) · `UPDATE` només de `display_name, bio, city, birthday, avatar_path, cover_path` del propi perfil |
| `invitations` | res | `SELECT/INSERT/UPDATE` només si és admin |
| `posts` | res | Llegir: membres. Crear: en nom propi, a murs de membres actius. Editar (`body`): autor. Esborrar: autor, propietari del mur o admin |
| `comments` | res | Llegir: membres. Crear: en nom propi. Esborrar: autor, propietari del mur o admin |
| `likes` | res | Llegir: membres. Crear/esborrar: només el propi |
| `photos` / `post_photos` | res | Llegir: membres. Crear: només fotos pròpies (a la carpeta pròpia) i als posts propis. Esborrar: propietari o admin |
| `notifications` | res | Només les pròpies: llegir, marcar com a llegides (`read_at`) i esborrar |
| `wishlist_items`, `songs`, `playlists` | res | Llegir: membres. Crear/editar: propietari. Esborrar: propietari o admin |
| Storage `avatars`, `photos` | res | Llegir: membres actius. Escriure: només a `<uid>/…`. Esborrar: propietari o admin |

`username`, `role`, `status` i `invitation_id` **no es poden modificar des del client** (privilegis de columna). Els canvis de rol i suspensions es faran amb funcions d'admin a la Fase 5.

## Capes

1. **RLS + privilegis** (barrera real).
2. **Server Actions** amb validació zod i comprovació de sessió.
3. **Proxy** (`src/proxy.ts`): redirigeix a `/login` sense sessió. Només és comoditat.
4. **UI**: amaga el que no toca. Només és comoditat.

## Altres mesures

- Sessions en cookies gestionades per `@supabase/ssr`. `getClaims()` valida el JWT.
- Redireccions `?next=` filtrades (`safeNext`) contra redireccions obertes.
- Recuperació de contrasenya: mateixa resposta tant si el correu existeix com si no.
- Límits d'intents: els de Supabase Auth (login, registre, correus) + tokens d'invitació de 256 bits.
- Comptes suspesos: no poden entrar (es comprova al login i a cada pàgina) i les RLS els deixen sense accés.

## Enllaços externs (oEmbed)

El servidor només consulta l'oEmbed de **Spotify** i **YouTube** (llista tancada d'expressions regulars), mai una URL qualsevol, per evitar que es pugui fer servir per accedir a altres llocs (SSRF). Si l'oEmbed falla, simplement no hi ha portada automàtica.

## Administració (Fase 5)

Panell `/admin` (Invitacions · Membres · Moderació). Tres capes:
1. `requireAdmin()` a cada pàgina i acció: un no-admin rep un 404.
2. Les funcions `admin_*` comproven `is_admin()` **dins de Postgres** (no es poden cridar saltant-se l'app).
3. Salvaguardes: ningú es pot suspendre, degradar ni eliminar a si mateix, i sempre queda almenys un admin actiu.

Moderació: l'admin pot eliminar qualsevol publicació, comentari, foto, desig, cançó o playlist (polítiques RLS de `delete`).
Un compte suspès no pot entrar (es comprova al login i a cada pàgina) i les RLS el deixen sense accés a res; el seu contingut es manté visible per als altres.

## Capçaleres HTTP (next.config.ts)

| Capçalera | Per a què |
|---|---|
| `Content-Security-Policy` | Limita d'on es carreguen scripts, imatges, iframes (només Spotify) i connexions (només Sorli i Supabase) |
| `X-Frame-Options: DENY` + `frame-ancestors 'none'` | Ningú pot incrustar Sorli (anti-clickjacking) |
| `Strict-Transport-Security` | Força HTTPS |
| `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` | Endureixen el navegador |
| `X-Robots-Tag: noindex` | Xarxa privada: fora dels cercadors |

Cookies de sessió: `SameSite=Lax`, `Secure` en producció. No són `HttpOnly` perquè el client del navegador les necessita per pujar imatges a Storage; les RLS continuen sent la barrera.

## Pendents de configurar al panell de Supabase (no es poden fer per codi)

- **SMTP propi** (p. ex. Gmail amb contrasenya d'aplicació) perquè els correus arribin a tots els membres.
- **Site URL / Redirect URLs** → `https://sorli.netlify.app`.
- **Leaked password protection** (si el pla ho permet).
