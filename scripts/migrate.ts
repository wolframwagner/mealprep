/**
 * Apply SQL files from /supabase/migrations against a Postgres database.
 *
 *   npm run db:migrate        # apply pending migrations
 *   npm run db:status         # show applied + pending
 *   npm run db:migrate -- --force   # re-run every file (dangerous)
 *
 * Reads DATABASE_URL from .env.local (or the current env). Tracks applied
 * filenames in a `schema_migrations` table so it's safe to run repeatedly.
 */
import { Client } from 'pg';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Manually load .env.local
try {
  const envFile = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf8');
  for (const line of envFile.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  // .env.local is optional
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Missing DATABASE_URL in env (set it in .env.local)');
  console.error('Get the connection string from: Supabase → Project Settings → Database → Connection string (URI)');
  process.exit(1);
}

const MIGRATIONS_DIR = resolve(__dirname, '..', 'supabase', 'migrations');
const FORCE = process.argv.includes('--force');
const STATUS_ONLY = process.argv.includes('--status');

async function ensureTable(client: Client) {
  await client.query(`
    create table if not exists public.schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    );
  `);
}

async function appliedFiles(client: Client): Promise<Set<string>> {
  const { rows } = await client.query<{ filename: string }>(
    'select filename from public.schema_migrations order by filename',
  );
  return new Set(rows.map((r) => r.filename));
}

function listMigrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

async function main() {
  const client = new Client({ connectionString: url });
  await client.connect();
  await ensureTable(client);

  const applied = await appliedFiles(client);
  const files = listMigrationFiles();

  if (STATUS_ONLY) {
    console.log('Applied:');
    for (const f of applied) console.log(`  ✓ ${f}`);
    console.log('Pending:');
    const pending = files.filter((f) => !applied.has(f));
    if (pending.length === 0) console.log('  (none)');
    for (const f of pending) console.log(`  · ${f}`);
    await client.end();
    return;
  }

  const target = FORCE ? files : files.filter((f) => !applied.has(f));

  if (target.length === 0) {
    console.log('Nothing to migrate — database is up to date.');
    await client.end();
    return;
  }

  for (const file of target) {
    const sql = readFileSync(resolve(MIGRATIONS_DIR, file), 'utf8');
    process.stdout.write(`→ ${file} ... `);
    try {
      await client.query('begin');
      await client.query(sql);
      await client.query(
        'insert into public.schema_migrations (filename) values ($1) on conflict (filename) do nothing',
        [file],
      );
      await client.query('commit');
      console.log('ok');
    } catch (err) {
      await client.query('rollback');
      console.log('FAILED');
      console.error(err);
      await client.end();
      process.exit(1);
    }
  }

  console.log(`\nApplied ${target.length} migration(s).`);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
