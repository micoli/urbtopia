export interface CloudConfig {
  url: string;
  publishableKey: string;
}

export function readCloudConfig(env: Record<string, unknown> = import.meta.env): CloudConfig | null {
  const url = env.VITE_SUPABASE_URL;
  const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (typeof url !== 'string' || typeof publishableKey !== 'string') return null;
  if (url.trim() === '' || publishableKey.trim() === '') return null;
  return { url: url.trim(), publishableKey: publishableKey.trim() };
}

export const cloudEnabled = readCloudConfig() !== null;
