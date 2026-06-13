# Deploying Mealprep to Vercel

The app is a standard Next.js 14 project, so Vercel picks it up with zero
configuration. The only things to wire up are the Supabase environment
variables and (optionally) the database connection string for automatic
migrations.

## 1. Prepare Supabase

1. Create a project at <https://supabase.com/dashboard> (free tier is fine).
2. **Project Settings → API** — copy these into a safe place:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` *(server-only, never
     exposed to the browser)*
3. **Project Settings → Database → Connection string → URI** — copy the
   `postgresql://postgres:…@db.xxxx.supabase.co:5432/postgres` value into
   `DATABASE_URL`.
4. **Authentication → URL Configuration** — add your Vercel domain
   (e.g. `https://mealprep.vercel.app`) to:
   - **Site URL**
   - **Additional Redirect URLs** (include both the production URL and the
     `https://*.vercel.app` wildcard for previews)

## 2. Push to GitHub

```bash
git init
git add .
git commit -m "feat: initial mealprep app"
gh repo create mealprep --public --source=. --push
```

(Vercel imports from GitHub, GitLab, or Bitbucket — pick whichever you use.)

## 3. Create the Vercel project

**Option A — dashboard**
1. Go to <https://vercel.com/new>.
2. Import the GitHub repo.
3. Vercel auto-detects `Next.js` and uses `npm run build` — leave the defaults.
4. Expand **Environment Variables** and add:

   | Name                          | Value                                            | Environments |
   | ----------------------------- | ------------------------------------------------ | ------------ |
   | `NEXT_PUBLIC_SUPABASE_URL`    | `https://xxxx.supabase.co`                       | all          |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the anon key                                   | all          |
   | `SUPABASE_SERVICE_ROLE_KEY`   | the service-role key *(sensitive — Preview+Production only)* | production, preview |
   | `DATABASE_URL`                | the Postgres URI *(sensitive — Preview+Production only)* | production, preview |

   `SUPABASE_SERVICE_ROLE_KEY` and `DATABASE_URL` should be marked sensitive
   so they're hidden in logs and only exposed at build time.

5. Click **Deploy**. The first build runs `prebuild` → `next build`.
   - If `DATABASE_URL` is set, the migration runner applies any pending SQL
     files from `supabase/migrations/`.
   - The Next.js build then produces the production bundle.

**Option B — CLI**
```bash
npm i -g vercel
vercel login
vercel link                  # creates .vercel/
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production   # sensitive
vercel env add DATABASE_URL production                # sensitive
vercel --prod
```

## 4. First-time seed

Migrations create the empty schema. To load the 6 themed weeks, run the
seed script from your terminal — it uses the service-role key to bypass
RLS:

```bash
# locally, with .env.local pointing at the same Supabase project
npm run db:seed
```

You can also run it from CI as a one-off job.

## 5. Custom domain (optional)

**Vercel → Project → Settings → Domains** — add your domain, then in your
DNS provider point the CNAME to `cname.vercel-dns.com`. Vercel
auto-provisions the certificate.

Don't forget to add the custom domain to the Supabase **Additional Redirect
URLs** list.

## 6. Ongoing workflow

```bash
# work on a feature
git checkout -b feat/shopping-offline
# … make changes …
npm run db:status           # see which migrations are pending
git add supabase/migrations/ # include any new .sql files
git commit -m "feat: add user_progress index"
git push
```

Each push opens a Vercel preview with its own URL. Migrations are applied
automatically (because `DATABASE_URL` is in scope), so preview environments
stay in sync with production schema.

For production:

```bash
# either merge to main → auto-deploy
# or promote a specific deployment from the Vercel dashboard
```

## Troubleshooting

| Symptom                                            | Fix |
| -------------------------------------------------- | --- |
| Build fails: `Missing NEXT_PUBLIC_SUPABASE_URL`    | Add it in Vercel → Settings → Environment Variables, then redeploy. |
| Build fails: `Missing DATABASE_URL`                | Either add it (sensitive) or remove the `prebuild` script. |
| Login redirects to a 404                          | Add the Vercel URL to Supabase → Auth → URL Configuration. |
| Service worker not registering                    | Make sure the URL is HTTPS (Vercel provides this automatically). |
| Preview build can't reach the DB                  | Check that `DATABASE_URL` is enabled for the **Preview** environment. |
| Migration half-applied                             | The runner wraps each file in a transaction. Re-run `npm run db:migrate` — the failed file won't be marked as applied, so it retries. |
