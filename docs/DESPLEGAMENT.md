# Desplegament

Sorli funciona amb **Netlify** (web) + **Supabase** (base de dades, autenticació i fitxers).

> El PRD original proposava Vercel. S'ha fet servir Netlify per decisió del projecte. El codi no depèn de cap dels dos: Next.js funciona igual a tots dos.

## Com està muntat ara

| Peça | On | Detall |
|---|---|---|
| Web | Netlify, projecte `sorli` | https://sorli.netlify.app · connectat a GitHub `janaigutierrez/sorli`, branca `main` |
| Base de dades + Auth + Storage | Supabase, projecte `sorli` | `vtietcaydzqqxvwcriqk` · regió eu-west-3 (París) · pla gratuït |
| Correus | Gmail via SMTP propi de Supabase | Contrasenya d'aplicació de Google |

**Cada `git push` a `main` es publica sol** en 2-3 minuts (Netlify → Deploys). Si un desplegament falla, la versió anterior continua en línia.

## Variables d'entorn (Netlify → Project configuration → Environment variables)

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://vtietcaydzqqxvwcriqk.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | clau publicable (`sb_publishable_…`) de Supabase → Project Settings → API Keys |
| `NEXT_PUBLIC_SITE_URL` | `https://sorli.netlify.app` |

No cal cap clau secreta.

## Configuració de Supabase (panell; no es pot fer per codi)

0. ⚠️ **Authentication → Sign In / Providers → "Allow new users to sign up" ha d'estar ACTIVAT.**
   Sembla contradictori en una xarxa privada, però qui impedeix registres sense invitació és el **trigger de Postgres** (vegeu PERMISOS.md), no aquest interruptor. Si el desactives, **ningú es pot registrar, ni amb invitació** (error `signup_disabled`).
1. **Authentication → URL Configuration**
   - Site URL: `https://sorli.netlify.app`
   - Redirect URLs: `https://sorli.netlify.app/**` i `http://localhost:3000/**`
2. **Authentication → Emails → SMTP Settings**: SMTP propi (Gmail: `smtp.gmail.com`, port `587`, usuari = el teu Gmail, contrasenya = contrasenya d'aplicació).
3. **Authentication → Emails → Templates**: plantilles en català de [`docs/correus/`](correus/README.md).
4. *(Opcional)* **Leaked password protection**, si el pla ho permet.

## Migracions de base de dades

Totes són a `supabase/migrations/` i **ja estan aplicades** al projecte. Per muntar Sorli en un projecte de Supabase nou:

1. Crea el projecte i obre **SQL Editor**.
2. Executa els fitxers de `supabase/migrations/` **en ordre** (001 → 006).
3. Crea la primera invitació d'admin a mà (vegeu [BASE-DE-DADES.md](BASE-DE-DADES.md#a-mà-emergència-si-no-hi-ha-cap-admin)) amb `role = 'admin'`.
4. Regenera els tipus: `npx supabase login` i `npm run db:types` (canvia el `--project-id` a `package.json`).

## Proves abans de publicar

```bash
npm run typecheck   # TypeScript
npm run lint        # ESLint
npm test            # proves unitàries (lib + validacions), sense dependències extra
npm run build       # build de producció
```

Proves de seguretat de la base de dades: enganxa [`supabase/tests/rls.sql`](../supabase/tests/rls.sql) al **SQL Editor** de Supabase i executa'l. Fa ~35 comprovacions (invitacions, RLS, admin, suspensions) dins una transacció que **es desfà sola**: no toca dades reals. Totes han de sortir `OK`.

## Si alguna cosa falla

| Símptoma | On mirar |
|---|---|
| La web no s'actualitza | Netlify → Deploys → l'últim desplegament i el seu log |
| Error a una pàgina | Netlify → Logs → Functions |
| No arriben correus | Supabase → Authentication → Logs, i la carpeta de correu brossa |
| "Invitació no vàlida" | `/admin` → Invitacions: mira'n l'estat (usada, caducada, revocada) |
| "El registre està desactivat" | Activa "Allow new users to sign up" (punt 0 de la configuració de Supabase) |
| Error en clicar un botó just després d'un desplegament | La pàgina era de la versió anterior: recarrega-la |
| Supabase diu "paused" | El pla gratuït pausa el projecte després d'una setmana sense ús: Supabase → **Restore project** |
