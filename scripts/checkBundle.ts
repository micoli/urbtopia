import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const SECRET_KEY = /sb_secret_[A-Za-z0-9_-]{16,}/;
const JWT = /eyJ[A-Za-z0-9_-]{10,}\.([A-Za-z0-9_-]{10,})\.[A-Za-z0-9_-]{10,}/g;
const SUPABASE_JS_MARKER = 'sb_temp_';

export function findLeakedSupabaseKey(text: string): string | null {
  if (SECRET_KEY.test(text)) return 'sb_secret_ key';
  for (const match of text.matchAll(JWT)) {
    try {
      const payload = JSON.parse(Buffer.from(match[1] ?? '', 'base64url').toString('utf8')) as { role?: unknown };
      if (payload.role === 'service_role') return 'service_role JWT';
    } catch {
      // Not a JWT payload.
    }
  }
  return null;
}

export function mainEntryOf(indexHtml: string): string | null {
  return /<script[^>]+src="\.?\/?(assets\/[^"]+\.js)"/.exec(indexHtml)?.[1] ?? null;
}

export function checkDist(dist: string): string[] {
  const problems: string[] = [];
  const assets = readdirSync(join(dist, 'assets')).filter((name) => name.endsWith('.js'));
  for (const name of assets) {
    const leaked = findLeakedSupabaseKey(readFileSync(join(dist, 'assets', name), 'utf8'));
    if (leaked) problems.push(`${name} contains a ${leaked}`);
  }
  const entry = mainEntryOf(readFileSync(join(dist, 'index.html'), 'utf8'));
  if (!entry) return [...problems, 'main entry script not found in index.html'];
  if (readFileSync(join(dist, entry), 'utf8').includes(SUPABASE_JS_MARKER)) problems.push(`supabase-js is bundled in the main entry ${entry}`);
  return problems;
}

if (process.argv[1]?.endsWith('checkBundle.ts')) {
  const problems = checkDist(process.argv[2] ?? 'dist');
  for (const problem of problems) console.error(problem);
  process.exit(problems.length === 0 ? 0 : 1);
}
