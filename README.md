# Sorli

> «Benvinguts a Sorli»

Xarxa social privada per a un grup d'amics, amb l'estètica de les xarxes clàssiques (2009-2012) i identitat turquesa pròpia. Només s'hi entra per invitació.

## Stack

- **Next.js 16** (App Router, Server Actions, `proxy.ts`) · **React 19** · **TypeScript**
- **Tailwind CSS 4** (tokens a `src/app/globals.css`)
- **Supabase**: Postgres + Auth + Storage, amb seguretat per **RLS**
- **zod** per a la validació al servidor
- Desplegament a **Vercel**

## Posada en marxa

```bash
npm install
cp .env.example .env.local   # i omple les variables (vegeu sota)
npm run dev
```

- http://localhost:3000/login: pantalla d'entrada
- http://localhost:3000/disseny: guia d'estil (només en desenvolupament)

## Variables d'entorn

| Variable | On | Descripció |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | navegador + servidor | URL del projecte Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | navegador + servidor | Clau publicable (`sb_publishable_…`). Segura al navegador: tot passa per RLS |
| `SUPABASE_SECRET_KEY` | **només servidor** | Clau secreta (`sb_secret_…`). Salta les RLS: només per crear usuaris per invitació i esborrar comptes |
| `NEXT_PUBLIC_SITE_URL` | navegador + servidor | URL pública de l'app (enllaços d'invitació i de recuperació) |

Les variables es validen amb zod a `src/lib/env.ts` i `src/lib/env.server.ts`. Si en falta alguna, l'app falla en arrencar en lloc de fallar més tard.

## Estructura

```
src/
  app/
    (auth)/            login, registre, recuperació (sense sessió)
    (app)/             zona de membres (amb sessió)       ← Fase 3
    (dev)/disseny      guia d'estil (només dev)
  components/ui/       Button, Card, Avatar, Tabs, Input…
  components/layout/   Header, NavLinks, PageShell (3 columnes)
  features/<mòdul>/    actions.ts · queries.ts · schemas.ts · components/
  lib/supabase/        client (navegador) · server · admin (secret) · proxy
  proxy.ts             refresc de sessió + protecció de rutes
  types/database.ts    generat amb `npm run db:types`
supabase/migrations/   SQL versionat
docs/                  base de dades, permisos, desplegament
```

## Seguretat (resum)

- Les **RLS** són la barrera principal. El proxy i la UI només són comoditat.
- La clau secreta s'importa només des de fitxers marcats amb `server-only`.
- El registre públic de Supabase **està desactivat**: els comptes es creen al servidor després de validar una invitació.

## Estat

- [x] Fase 1: configuració i sistema de disseny
- [ ] Fase 2: autenticació i registre per invitació
- [ ] Fase 3: feed, murs, publicacions, comentaris, m'agrada
- [ ] Fase 4: galeria, wishlist, música, Spotify
- [ ] Fase 5: administració i revisió de seguretat
- [ ] Fase 6: acabats, proves i desplegament
