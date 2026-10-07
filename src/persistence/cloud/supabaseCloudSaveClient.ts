import type { SupabaseClient } from '@supabase/supabase-js';
import type { CloudConfig } from './cloudConfig';
import type { Database, Json } from './database.types';
import { CloudError, type CloudSave, type CloudSaveClient, type CloudSaveVersion, type PushInput } from './types';

const PUSH_PATH = '/rpc/urb_push_save';
const KEEPALIVE_BODY_LIMIT = 60_000;

type Client = SupabaseClient<Database>;

interface PostgrestFailure {
  message: string;
  details?: string | null;
  code?: string;
}

export function toCloudError(failure: PostgrestFailure): CloudError {
  if (failure.message.includes('urb_conflict')) return new CloudError('conflict', Number(failure.details ?? 0));
  if (failure.message.includes('urb_too_large')) return new CloudError('too-large');
  if (failure.message.includes('urb_unauthenticated') || failure.code === '28000' || failure.code === '42501') return new CloudError('unauthenticated');
  if (/fetch|network|load failed/i.test(failure.message) || failure.code === '') return new CloudError('offline');
  return new CloudError('unknown');
}

export async function createSupabaseCloudSaveClient(config: CloudConfig): Promise<CloudSaveClient> {
  const { createClient } = await import('@supabase/supabase-js');
  let keepalive = false;
  const client: Client = createClient<Database>(config.url, config.publishableKey, {
    global: { fetch: (input, init) => fetch(input, keepalive && String(input).includes(PUSH_PATH) ? { ...init, keepalive: true } : init) },
  });
  return new SupabaseCloudSaveClient(client, (value) => {
    keepalive = value;
  });
}

class SupabaseCloudSaveClient implements CloudSaveClient {
  constructor(
    private client: Client,
    private setKeepalive: (value: boolean) => void,
  ) {}

  async signIn(): Promise<void> {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new CloudError('offline');
    const { data, error } = await this.attempt(() => this.client.auth.getSession());
    if (error) throw toCloudError(error);
    if (data.session) return;
    const signed = await this.attempt(() => this.client.auth.signInAnonymously());
    if (signed.error) throw toCloudError(signed.error);
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut();
  }

  async push(input: PushInput): Promise<number> {
    this.setKeepalive(input.keepalive === true && input.envelope.length < KEEPALIVE_BODY_LIMIT);
    try {
      const { data, error } = await this.attempt(() =>
        this.client.rpc('urb_push_save', {
          p_base_revision: input.baseRevision,
          p_envelope: JSON.parse(input.envelope) as Json,
          p_format_version: input.formatVersion,
          p_client_saved_at: new Date(input.savedAt).toISOString(),
          p_keep_previous: input.keepPrevious === true,
        }),
      );
      if (error) throw toCloudError(error);
      return data;
    } finally {
      this.setKeepalive(false);
    }
  }

  async latest(): Promise<CloudSave | null> {
    const { data, error } = await this.attempt(() =>
      this.client.from('urb_saves').select('revision, envelope, client_saved_at').order('revision', { ascending: false }).limit(1).maybeSingle(),
    );
    if (error) throw toCloudError(error);
    if (!data) return null;
    return { revision: data.revision, envelope: JSON.stringify(data.envelope), clientSavedAt: Date.parse(data.client_saved_at) };
  }

  async list(): Promise<CloudSaveVersion[]> {
    const { data, error } = await this.attempt(() => this.client.rpc('urb_list_saves'));
    if (error) throw toCloudError(error);
    return data.map((row) => ({ revision: row.revision, clientSavedAt: Date.parse(row.client_saved_at), createdAt: Date.parse(row.created_at) }));
  }

  async restore(revision: number): Promise<number> {
    const { data, error } = await this.attempt(() => this.client.rpc('urb_restore_save', { p_revision: revision }));
    if (error) throw toCloudError(error);
    return data;
  }

  async deleteMine(): Promise<void> {
    const { error } = await this.attempt(() => this.client.rpc('urb_delete_my_saves'));
    if (error) throw toCloudError(error);
  }

  private async attempt<T>(call: () => PromiseLike<T>): Promise<T> {
    try {
      return await call();
    } catch (error) {
      if (error instanceof CloudError) throw error;
      throw new CloudError('offline');
    }
  }
}
