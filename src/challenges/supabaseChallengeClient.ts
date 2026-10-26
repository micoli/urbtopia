import type { SupabaseClient } from '@supabase/supabase-js';
import type { CloudConfig } from '../persistence/cloud/cloudConfig';
import type { Database } from '../persistence/cloud/database.types';
import { loadSharedSupabase } from '../persistence/cloud/sharedSupabase';
import { parseAcceptance, parseChallengeSnapshot, parseDeclaration } from './parseSnapshot';
import { ChallengeError, type AcceptedChallenge, type ChallengeClient, type ChallengeDeclaration, type ChallengeErrorKind, type ChallengeSnapshot } from './types';

type Client = SupabaseClient<Database>;

interface PostgrestFailure {
  message: string;
  details?: string | null;
  code?: string;
}

const MESSAGE_KINDS: ReadonlyArray<readonly [string, ChallengeErrorKind]> = [
  ['urb_unauthenticated', 'unauthenticated'],
  ['urb_email_required', 'email-required'],
  ['urb_handle_required', 'handle-required'],
  ['urb_challenge_unavailable', 'challenge-unavailable'],
  ['urb_challenge_busy', 'challenge-busy'],
];

export function toChallengeError(failure: PostgrestFailure): ChallengeError {
  const known = MESSAGE_KINDS.find(([marker]) => failure.message.includes(marker));
  if (known) return new ChallengeError(known[1]);
  if (failure.code === '28000' || failure.code === '42501') return new ChallengeError('unauthenticated');
  if (/fetch|network|load failed/i.test(failure.message) || failure.code === '') return new ChallengeError('offline');
  return new ChallengeError('unknown');
}

export async function createSupabaseChallengeClient(config: CloudConfig, cityId: string): Promise<ChallengeClient> {
  const { client } = await loadSharedSupabase(config);
  return new SupabaseChallengeClient(client, cityId);
}

class SupabaseChallengeClient implements ChallengeClient {
  constructor(
    private client: Client,
    private cityId: string,
  ) {}

  async list(): Promise<ChallengeSnapshot> {
    return parseChallengeSnapshot(await this.call(() => this.client.rpc('urb_list_challenges', { p_city: this.cityId })));
  }

  async accept(challengeId: string): Promise<AcceptedChallenge> {
    return parseAcceptance(await this.call(() => this.client.rpc('urb_accept_challenge', { p_challenge: challengeId, p_city: this.cityId })));
  }

  async declare(challengeId: string): Promise<ChallengeDeclaration> {
    return parseDeclaration(await this.call(() => this.client.rpc('urb_declare_challenge', { p_challenge: challengeId, p_city: this.cityId })));
  }

  async abandon(challengeId: string): Promise<void> {
    await this.call(() => this.client.rpc('urb_abandon_challenge', { p_challenge: challengeId, p_city: this.cityId }));
  }

  private async call<T>(request: () => PromiseLike<{ data: T; error: PostgrestFailure | null }>): Promise<T> {
    try {
      const { data, error } = await request();
      if (error) throw toChallengeError(error);
      return data;
    } catch (error) {
      if (error instanceof ChallengeError) throw error;
      throw new ChallengeError('offline');
    }
  }
}
