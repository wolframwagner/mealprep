#!/usr/bin/env node
/**
 * Pre-build hook for Vercel and local builds.
 *
 *   - If DATABASE_URL is set → run pending SQL migrations
 *   - Otherwise                → skip silently (Vercel preview builds work
 *                                against the production DB only if explicitly opted in)
 */
import { execSync } from 'node:child_process';

if (process.env.DATABASE_URL) {
  console.log('▶ prebuild: DATABASE_URL detected, running migrations…');
  try {
    execSync('npx tsx scripts/migrate.ts', { stdio: 'inherit' });
  } catch (err) {
    console.error('✗ prebuild: migration failed');
    process.exit(err.status ?? 1);
  }
} else {
  console.log('▶ prebuild: no DATABASE_URL, skipping migrations');
}
