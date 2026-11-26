# Sorli

> «Benvinguts a Sorli»

Xarxa social privada per a un grup d'amics, amb l'estètica de les xarxes clàssiques (2009-2012) i identitat turquesa pròpia. Només s'hi entra per invitació.

**En línia:** https://sorli.netlify.app

## Què hi ha

- **Inici**: feed cronològic de tots els murs i compositor de publicacions amb fotos.
- **Perfil**: portada, avatar quadrat i quatre pestanyes:
  - **Mur**: publicacions pròpies i les que hi deixen els altres.
  - **Fotos**: àlbum global, amb visor a pantalla completa.
  - **Wishes**: llista de desitjos.
  - **Música**: cançons i playlists de Spotify.
- **Interaccions**: m'agrada (un per persona), comentaris i respostes d'un nivell, notificacions dins l'app.
- **Cercador** de membres i **Ajustos**: correu, contrasenya, privacitat, notificacions, sessió i eliminar el compte.
- **Administració** (`/admin`): invitacions d'un sol ús; membres (suspendre, rol, eliminar); moderació.
- **Sense sistema d'amistats**: una invitació vàlida dona accés a tota la comunitat.

## Stack

- **Next.js 16** (App Router, Server Actions, `proxy.ts`) · **React 19** · **TypeScript**
- **Tailwind CSS 4** (tokens a `src/app/globals.css`)
- **Supabase**: Postgres + Auth + Storage, amb seguretat per **RLS**
- **zod** per a la validació al servidor (l'única dependència extra)
- Desplegament a **Netlify**

## Posada en marxa (local)

Cal Node 22.18 o superior (els tests fan servir el *type stripping* de Node).

```bash
git clone https://github.com/janaigutierrez/sorli.git
cd sorli
npm install
cp .env.example .env.local   # i omple les variables (vegeu sota)
npm run dev
```

- http://localhost:3000/login: pantalla d'entrada
- http://localhost:3000/disseny: guia d'estil amb els components reals (només en desenvolupament)

## Variables d'entorn

| Variable | On | Descripció |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | navegador + servidor | URL del projecte Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | navegador + servidor | Clau publicable (`sb_publishable_…`). Segura al navegador: tot passa per RLS |
| `NEXT_PUBLIC_SITE_URL` | navegador + servidor | URL pública de l'app (enllaços d'invitació i de recuperació) |

Es validen amb zod a `src/lib/env.ts`: si en falta alguna, l'app falla en arrencar en lloc de fallar més tard. **No cal cap clau secreta.**

## Scripts

| Script | Què fa |
|---|---|
| `npm run dev` | Servidor de desenvolupament |
| `npm run build` / `npm start` | Build i servidor de producció |
| `npm run typecheck` | TypeScript (genera abans els tipus de rutes de Next) |
| `npm run lint` | ESLint |
| `npm test` | Proves unitàries amb el test runner de Node (sense dependències) |
| `npm run db:types` | Regenera `src/types/database.ts` des de Supabase |

## Estructura

```
src/
  app/
    (auth)/            login, registre/[token], recuperar, nova-contrasenya
    (app)/             zona de membres: inici, perfil/[username]/(mur|fotos|wishes|musica|editar),
                       publicacio/[id], cercador, notificacions, ajustos, admin/(membres|moderacio)
    auth/              callback (PKCE) i sortir
    media/             serveix imatges privades de Storage amb URL signada
    (dev)/disseny      guia d'estil (només dev)
  components/ui/       Button, Card, Avatar, Tabs, Lightbox, formularis…
  components/layout/   Header, NavLinks, PageShell (3 columnes), MembersBox
  features/<mòdul>/    actions.ts · queries.ts · schemas.ts · components/
                       (auth, posts, profiles, photos, personal, notifications, settings, admin)
  lib/                 supabase/, auth.ts, dates.ts, media.ts, images.ts, oembed.ts…
  proxy.ts             refresc de sessió + protecció de rutes
  types/database.ts    tipus de la BD
supabase/migrations/   SQL versionat (6 migracions)
supabase/tests/        proves de seguretat de la BD (rls.sql)
tests/unit/            proves unitàries
docs/                  base de dades, permisos, desplegament, correus
```

## Documentació

- [`docs/BASE-DE-DADES.md`](docs/BASE-DE-DADES.md): taules, funcions, migracions i com crear invitacions a mà.
- [`docs/PERMISOS.md`](docs/PERMISOS.md): model de seguretat, RLS per taula, administració i capçaleres HTTP.
- [`docs/DESPLEGAMENT.md`](docs/DESPLEGAMENT.md): Netlify, Supabase, variables, proves i què fer si falla.
- [`docs/correus/`](docs/correus/README.md): plantilles de correu en català.

## Seguretat (resum)

- Les **RLS** són la barrera principal. El proxy i la UI només són comoditat.
- **No hi ha clau secreta enlloc.** El registre per invitació es valida dins Postgres amb triggers a `auth.users`: és impossible crear un compte sense invitació vàlida.
- Les imatges són en **buckets privats** i només les veuen membres actius.
- **Capçaleres HTTP**: CSP, anti-clickjacking, HSTS i `noindex`. Cookies `Secure` en producció.

## Estat

- [x] Fase 1: configuració i sistema de disseny
- [x] Fase 2: autenticació i registre per invitació
- [x] Fase 3: feed, murs, publicacions, comentaris, m'agrada, perfils, cercador, notificacions, ajustos
- [x] Fase 4: galeria, wishlist, música, Spotify
- [x] Fase 5: administració (invitacions, membres, moderació) i revisió de seguretat
- [x] Fase 6: visor de fotos, mòbil, correus en català, proves i documentació
