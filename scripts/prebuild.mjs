#!/usr/bin/env node
/**
 * Pre-build hook for Vercel and local builds.
 *
 *   - No DATABASE_URL                       → skip
 *   - Vercel build (VERCEL=1)               → skip unless RUN_MIGRATIONS_ON_VERCEL=true
 *   - Otherwise                             → run pending SQL migrations
 */
import { execSync } from 'node:child_process';

if (!process.env.DATABASE_URL) {
  console.log('▶ prebuild: no DATABASE_URL, skipping migrations');
} else if (process.env.VERCEL && !process.env.RUN_MIGRATIONS_ON_VERCEL) {
  console.log('▶ prebuild: Vercel build detected, skipping migrations');
  console.log('   Run them via `npm run db:push` or set RUN_MIGRATIONS_ON_VERCEL=1 to force.');
} else {
  console.log('▶ prebuild: DATABASE_URL detected, running migrations…');
  try {
    execSync('npx tsx scripts/migrate.ts', { stdio: 'inherit' });
  } catch (err) {
    console.error('✗ prebuild: migration failed');
    process.exit(err.status ?? 1);
  }
}
