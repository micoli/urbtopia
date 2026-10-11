import type { SupabaseClient } from '@supabase/supabase-js';
import type { CloudConfig } from './cloudConfig';
import type { Database } from './database.types';

const PUSH_PATH = '/rpc/urb_push_save';

export interface SharedSupabase {
  client: SupabaseClient<Database>;
  setKeepalive: (value: boolean) => void;
}

let shared: { config: CloudConfig; loaded: Promise<SharedSupabase> } | null = null;

export function loadSharedSupabase(config: CloudConfig): Promise<SharedSupabase> {
  if (shared && shared.config.url === config.url && shared.config.publishableKey === config.publishableKey) return shared.loaded;
  const loaded = create(config);
  shared = { config, loaded };
  return loaded;
}

async function create(config: CloudConfig): Promise<SharedSupabase> {
  const { createClient } = await import('@supabase/supabase-js');
  let keepalive = false;
  const client = createClient<Database>(config.url, config.publishableKey, {
    global: { fetch: (input, init) => fetch(input, keepalive && String(input).includes(PUSH_PATH) ? { ...init, keepalive: true } : init) },
  });
  return {
    client,
    setKeepalive: (value) => {
      keepalive = value;
    },
  };
}
