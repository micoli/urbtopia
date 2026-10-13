import { isValidHandle } from './handle';
import { SocialError, type SocialClient } from './types';

const MAX_LENGTH = 20;
const HASH_LENGTH = 4;
const MAX_ATTEMPTS = 20;

function shortHash(value: string): string {
  let hash = 5381;
  for (const char of value) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return hash.toString(36).padStart(HASH_LENGTH, '0').slice(-HASH_LENGTH);
}

function cut(value: string, length: number): string {
  return value.slice(0, length).replace(/-+$/, '');
}

export function handleFromEmail(email: string, attempt = 0): string {
  const slug = email.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const base = slug.length > MAX_LENGTH ? `${cut(slug, MAX_LENGTH - HASH_LENGTH - 1)}-${shortHash(slug)}` : slug;
  if (attempt === 0) return base;
  const suffix = `-${attempt + 1}`;
  return `${cut(base, MAX_LENGTH - suffix.length)}${suffix}`;
}

export async function claimLocalHandle(client: SocialClient, email: string): Promise<void> {
  try {
    await client.list(null);
    return;
  } catch (error) {
    if (!(error instanceof SocialError && error.kind === 'handle-required')) return;
  }
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const handle = handleFromEmail(email, attempt);
    if (!isValidHandle(handle)) continue;
    try {
      await client.setHandle(handle);
      return;
    } catch (error) {
      const retry = error instanceof SocialError && (error.kind === 'handle-taken' || error.kind === 'handle-forbidden');
      if (!retry) return;
    }
  }
}
