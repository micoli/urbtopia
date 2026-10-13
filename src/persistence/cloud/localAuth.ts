import { readCloudConfig } from './cloudConfig';
import { isPlausibleEmail } from './email';

const LOCAL_HOSTS = ['127.0.0.1', 'localhost'];

export function isLocalSupabaseUrl(url: string): boolean {
  try {
    return LOCAL_HOSTS.includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

export function readLocalAuthEmail(search: string, supabaseUrl: string, dev: boolean): string | null {
  if (!dev || !isLocalSupabaseUrl(supabaseUrl)) return null;
  const email = new URLSearchParams(search).get('local-auth')?.trim().toLowerCase();
  if (!email || !isPlausibleEmail(email)) return null;
  return email;
}

export function requestedLocalAuthEmail(): string | null {
  if (!import.meta.env.DEV) return null;
  const config = readCloudConfig();
  if (!config) return null;
  return readLocalAuthEmail(window.location.search, config.url, import.meta.env.DEV);
}

export function localAuthPassword(email: string): string {
  return `local-auth:${email}`;
}
