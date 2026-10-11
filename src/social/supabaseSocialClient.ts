import type { SupabaseClient } from '@supabase/supabase-js';
import type { CloudConfig } from '../persistence/cloud/cloudConfig';
import type { Database } from '../persistence/cloud/database.types';
import { loadSharedSupabase } from '../persistence/cloud/sharedSupabase';
import { parseSnapshot } from './parseSnapshot';
import { SocialError, type SocialClient, type SocialErrorKind, type SocialSnapshot } from './types';

type Client = SupabaseClient<Database>;

interface PostgrestFailure {
  message: string;
  details?: string | null;
  code?: string;
}

const MESSAGE_KINDS: ReadonlyArray<readonly [string, SocialErrorKind]> = [
  ['urb_unauthenticated', 'unauthenticated'],
  ['urb_email_required', 'email-required'],
  ['urb_handle_required', 'handle-required'],
  ['urb_handle_invalid', 'handle-invalid'],
  ['urb_handle_forbidden', 'handle-forbidden'],
  ['urb_handle_taken', 'handle-taken'],
  ['urb_handle_change_too_soon', 'handle-change-too-soon'],
  ['urb_rate_limited', 'rate-limited'],
  ['urb_cap_friends', 'cap-friends'],
  ['urb_cap_outgoing', 'cap-outgoing'],
  ['urb_not_found', 'not-found'],
];

function retryAfter(failure: PostgrestFailure): number | null {
  const seconds = Number(failure.details);
  return failure.details && Number.isFinite(seconds) ? seconds : null;
}

export function toSocialError(failure: PostgrestFailure): SocialError {
  const known = MESSAGE_KINDS.find(([marker]) => failure.message.includes(marker));
  if (known) return new SocialError(known[1], retryAfter(failure));
  if (failure.code === '28000' || failure.code === '42501') return new SocialError('unauthenticated');
  if (failure.code === 'over_request_rate_limit') return new SocialError('rate-limited');
  if (/fetch|network|load failed/i.test(failure.message) || failure.code === '') return new SocialError('offline');
  return new SocialError('unknown');
}

export async function createSupabaseSocialClient(config: CloudConfig): Promise<SocialClient> {
  const { client } = await loadSharedSupabase(config);
  return new SupabaseSocialClient(client);
}

class SupabaseSocialClient implements SocialClient {
  constructor(private client: Client) {}

  async setHandle(handle: string): Promise<void> {
    await this.call(() => this.client.rpc('urb_set_handle', { p_handle: handle }));
  }

  async setFindable(findable: boolean): Promise<void> {
    await this.call(() => this.client.rpc('urb_set_findable', { p_findable: findable }));
  }

  async sendRequestByEmail(email: string): Promise<void> {
    await this.call(() => this.client.rpc('urb_send_friend_request_by_email', { p_email: email }));
  }

  async acceptRequest(userId: string): Promise<void> {
    await this.call(() => this.client.rpc('urb_accept_friend_request', { p_user: userId }));
  }

  async refuseRequest(userId: string): Promise<void> {
    await this.call(() => this.client.rpc('urb_refuse_friend_request', { p_user: userId }));
  }

  async removeFriend(userId: string): Promise<void> {
    await this.call(() => this.client.rpc('urb_remove_friend', { p_user: userId }));
  }

  async block(userId: string): Promise<void> {
    await this.call(() => this.client.rpc('urb_block_user', { p_user: userId }));
  }

  async unblock(userId: string): Promise<void> {
    await this.call(() => this.client.rpc('urb_unblock_user', { p_user: userId }));
  }

  async list(cursor: number | null = null): Promise<SocialSnapshot> {
    const data = await this.call(() => this.client.rpc('urb_list_social', cursor === null ? {} : { p_cursor: cursor }));
    return parseSnapshot(data);
  }

  private async call<T>(request: () => PromiseLike<{ data: T; error: PostgrestFailure | null }>): Promise<T> {
    try {
      const { data, error } = await request();
      if (error) throw toSocialError(error);
      return data;
    } catch (error) {
      if (error instanceof SocialError) throw error;
      throw new SocialError('offline');
    }
  }
}
