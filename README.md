# Mealprep

A 6-week vegan meal-prep planner. Pick a themed week, shop the SOLL/IST list,
cook with scaled recipes, and track macros — fully bilingual (English / German)
and offline-capable as a PWA.

Built per the spec in [`AGENTS/mealprep_concept.md`](AGENTS/mealprep_concept.md)
and [`AGENTS/mealprep_process_integration.md`](AGENTS/mealprep_process_integration.md).

## Deploy to Vercel

See **[DEPLOY.md](DEPLOY.md)** for the full guide. Short version:

```bash
# 1. Push to GitHub
git init && git add . && git commit -m "init"
gh repo create mealprep --public --source=. --push

# 2. Import at https://vercel.com/new, set env vars:
#    NEXT_PUBLIC_SUPABASE_URL
#    NEXT_PUBLIC_SUPABASE_ANON_KEY
#    SUPABASE_SERVICE_ROLE_KEY  (sensitive)
#    DATABASE_URL               (sensitive — enables auto-migrations)
# 3. Deploy
```

`npm run prebuild` automatically applies pending SQL migrations on Vercel
when `DATABASE_URL` is set.

## Stack

- **Next.js 14** (App Router) on Vercel
- **Supabase** (Postgres + Auth + RLS) on the free tier
- **next-intl** for i18n (`en` / `de`)
- **Tailwind CSS** for styling
- **PWA** via `manifest.webmanifest` + a service worker that caches translations

## Project layout

```
app/                    Next.js App Router pages + API routes
  api/                  /weeks, /shopping-list, /progress, /user/preferences
  login/                Email + password auth
  shopping/[weekId]/    SOLL/IST shopping list with macro deviation
  cooking/[weekId]/     Cooking guide with scaled portions
  settings/             Language + account
components/             Reusable UI (I18nProvider, NavBar, WeekCard, etc.)
lib/                    Supabase clients, formatting, nutrition helpers
i18n/                   next-intl config + locale resolution
messages/               en.json / de.json
supabase/migrations/    SQL schema (runs against a real Postgres)
scripts/seed.ts         Loads AGENTS/mealprep_data.full.json into the DB
public/                 PWA manifest + service worker + icons
AGENTS/                 The concept / process / seed JSON
```

## Quick start

```bash
# 1. Install
npm install

# 2. Create a Supabase project (free tier) and copy the URL + anon key
cp .env.example .env.local
#   edit NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
#   add SUPABASE_SERVICE_ROLE_KEY (Settings → API → service_role)
#   add DATABASE_URL — from Project Settings → Database → Connection string (URI)
#     e.g. postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres

# 3. Apply the SQL schema (terminal)
npm run db:migrate
#   → also: `npm run db:status` shows applied + pending

# 3b. Or via the Supabase CLI
#   supabase link --project-ref <ref>
#   supabase db push

# 4. Seed the 6 weeks
npm run db:seed

# 5. Run
npm run dev
```

Open <http://localhost:3000>, sign up, and you should see the 6 weekly plans.

## Internationalization

The active locale is resolved per request in [`i18n/request.ts`](i18n/request.ts):

1. `mealprep.lang` cookie (set on first user choice)
2. `Accept-Language` header
3. Hard fallback: `de`

On first visit a non-blocking prompt asks the user to confirm. The choice is
mirrored in `localStorage` and `users.preferred_language` (via the API).

Translatable text is stored as JSONB with `de` and `en` keys. The seed file
`AGENTS/mealprep_data.full.json` follows the same shape.

## API

All data flows through REST routes under `app/api/`:

| Route                                | Purpose                          |
| ------------------------------------ | -------------------------------- |
| `GET  /api/weeks`                    | List all weeks                   |
| `GET  /api/weeks/:id/ingredients`    | Ingredients for a week           |
| `GET  /api/weeks/:id/sauces`         | Sauces (recipes) for a week      |
| `POST /api/shopping-list`            | SOLL list with planned macros    |
| `POST /api/progress`                 | Save IST quantities / checkoffs  |
| `POST /api/user/preferences`         | Update preferred language        |

These routes are the central interface; the same shape can power a Flutter
client later without touching the UI tree.

## PWA

`public/manifest.webmanifest` + `public/sw.js` give the app a service worker
that precaches `/`, `/login`, and the `messages/*.json` bundles so the
shopping list and cooking guide stay available offline. API calls always go to
the network.

## Nutrition

`lib/nutrition.ts` computes the macro delta between the planned (SOLL)
ingredient amount and the actual (IST) amount the user bought — the same logic
that drives the "Impact: -25g protein" line in the difference report.

## Scripts

```bash
npm run dev           # next dev
npm run build         # next build (runs prebuild → migrations → next build)
npm run start         # next start
npm run lint          # next lint
npm run typecheck     # tsc --noEmit

npm run db:migrate    # apply pending SQL migrations (uses DATABASE_URL)
npm run db:status     # show applied + pending migrations
npm run db:seed       # load AGENTS/mealprep_data.full.json into Supabase
npm run db:push       # supabase db push (alternative to db:migrate)
npm run db:reset      # supabase db reset (destructive)
```
