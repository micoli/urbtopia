import type { SupabaseClient } from '@supabase/supabase-js';
import type { CloudConfig } from '../persistence/cloud/cloudConfig';
import type { Database, Json } from '../persistence/cloud/database.types';
import { loadSharedSupabase } from '../persistence/cloud/sharedSupabase';
import { parseHallOfFame, parseShowcase, parseStatus } from './parseHallOfFame';
import { ShowcaseError, type HallOfFameEntry, type Showcase, type ShowcaseClient, type ShowcaseErrorKind, type ShowcaseStatus } from './types';

type Client = SupabaseClient<Database>;

interface PostgrestFailure {
  message: string;
  code?: string;
}

const MESSAGE_KINDS: ReadonlyArray<readonly [string, ShowcaseErrorKind]> = [
  ['urb_unauthenticated', 'unauthenticated'],
  ['urb_email_required', 'email-required'],
  ['urb_handle_required', 'handle-required'],
  ['urb_notice_required', 'notice-required'],
  ['urb_too_large', 'too-large'],
  ['urb_not_found', 'not-found'],
];

export function toShowcaseError(failure: PostgrestFailure): ShowcaseError {
  const known = MESSAGE_KINDS.find(([marker]) => failure.message.includes(marker));
  if (known) return new ShowcaseError(known[1]);
  if (failure.code === '28000' || failure.code === '42501') return new ShowcaseError('unauthenticated');
  if (/fetch|network|load failed/i.test(failure.message) || failure.code === '') return new ShowcaseError('offline');
  return new ShowcaseError('unknown');
}

export async function createSupabaseShowcaseClient(config: CloudConfig): Promise<ShowcaseClient> {
  const { client } = await loadSharedSupabase(config);
  return new SupabaseShowcaseClient(client);
}

class SupabaseShowcaseClient implements ShowcaseClient {
  constructor(private client: Client) {}

  async status(): Promise<ShowcaseStatus> {
    return parseStatus(await this.call(() => this.client.rpc('urb_showcase_status')));
  }

  async markNoticeSeen(): Promise<void> {
    await this.call(() => this.client.rpc('urb_mark_hall_of_fame_notice_seen'));
  }

  async setOptOut(optedOut: boolean): Promise<void> {
    await this.call(() => this.client.rpc('urb_set_hall_of_fame_opt_out', { p_opted_out: optedOut }));
  }

  async publish(envelope: string, formatVersion: number, citizens: number): Promise<void> {
    await this.call(() => this.client.rpc('urb_publish_showcase', { p_envelope: JSON.parse(envelope) as Json, p_format_version: formatVersion, p_citizens: citizens }));
  }

  async hallOfFame(): Promise<HallOfFameEntry[]> {
    return parseHallOfFame(await this.call(() => this.client.rpc('urb_hall_of_fame')));
  }

  async getShowcase(userId: string): Promise<Showcase> {
    return parseShowcase(await this.call(() => this.client.rpc('urb_get_showcase', { p_user: userId })));
  }

  private async call<T>(request: () => PromiseLike<{ data: T; error: PostgrestFailure | null }>): Promise<T> {
    try {
      const { data, error } = await request();
      if (error) throw toShowcaseError(error);
      return data;
    } catch (error) {
      if (error instanceof ShowcaseError) throw error;
      throw new ShowcaseError('offline');
    }
  }
}
