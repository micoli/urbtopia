import type { SupabaseClient } from '@supabase/supabase-js';
import type { CloudConfig } from '../persistence/cloud/cloudConfig';
import type { Database, Json } from '../persistence/cloud/database.types';
import { loadSharedSupabase } from '../persistence/cloud/sharedSupabase';
import type { TradeLine } from '../core';
import { parseGroupMessages, parseGroups, parseMessages, parseSnapshot, parseTradeClaim } from './parseSnapshot';
import { SocialError, type GroupMessage, type GroupsSnapshot, type Message, type SocialClient, type SocialErrorKind, type SocialSnapshot, type TradeClaim, type TradeSlot } from './types';

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
  ['urb_avatar_invalid', 'avatar-invalid'],
  ['urb_rate_limited', 'rate-limited'],
  ['urb_message_invalid', 'message-invalid'],
  ['urb_not_friends', 'not-friends'],
  ['urb_trade_invalid', 'trade-invalid'],
  ['urb_trade_conflict', 'trade-conflict'],
  ['urb_trade_unavailable', 'trade-unavailable'],
  ['urb_cap_trades_open', 'cap-trades-open'],
  ['urb_cap_friends', 'cap-friends'],
  ['urb_cap_outgoing', 'cap-outgoing'],
  ['urb_not_found', 'not-found'],
  ['urb_not_creator', 'not-creator'],
  ['urb_group_name_invalid', 'group-name-invalid'],
  ['urb_group_name_forbidden', 'group-name-forbidden'],
  ['urb_group_full', 'group-full'],
  ['urb_group_creator_cannot_leave', 'group-creator-cannot-leave'],
  ['urb_cap_groups_created', 'cap-groups-created'],
  ['urb_cap_groups_joined', 'cap-groups-joined'],
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

  async setAvatar(avatar: string | null): Promise<void> {
    await this.call(() => this.client.rpc('urb_set_avatar', { p_avatar: avatar as string }));
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

  async sendMessage(userId: string, body: string): Promise<number> {
    const id = await this.call(() => this.client.rpc('urb_send_message', { p_to: userId, p_body: body }));
    if (id === null) throw new SocialError('unknown');
    return id;
  }

  async listMessages(userId: string, afterId = 0): Promise<Message[]> {
    const data = await this.call(() => this.client.rpc('urb_list_messages', { p_with: userId, p_after: afterId }));
    return parseMessages(data);
  }

  async createTradeOffer(id: string, to: string, lot: TradeLine[], price: number): Promise<void> {
    await this.call(() => this.client.rpc('urb_create_trade_offer', { p_id: id, p_to: to, p_lot: lot as unknown as Json, p_price: price }));
  }

  async acceptTradeOffer(id: string): Promise<void> {
    await this.call(() => this.client.rpc('urb_accept_trade_offer', { p_id: id }));
  }

  async declineTradeOffer(id: string): Promise<void> {
    await this.call(() => this.client.rpc('urb_decline_trade_offer', { p_id: id }));
  }

  async claimTrade(id: string, slot: TradeSlot): Promise<TradeClaim> {
    const data = await this.call(() => this.client.rpc('urb_claim_trade', { p_id: id, p_slot: slot }));
    return parseTradeClaim(data);
  }

  async listGroups(cursor: number | null = null): Promise<GroupsSnapshot> {
    const data = await this.call(() => this.client.rpc('urb_list_groups', cursor === null ? {} : { p_cursor: cursor }));
    return parseGroups(data);
  }

  async createGroup(name: string, memberIds: string[]): Promise<string> {
    const id = await this.call(() => this.client.rpc('urb_create_group', { p_name: name, p_members: memberIds }));
    if (id === null) throw new SocialError('unknown');
    return id;
  }

  async renameGroup(groupId: string, name: string): Promise<void> {
    await this.call(() => this.client.rpc('urb_rename_group', { p_group: groupId, p_name: name }));
  }

  async addGroupMembers(groupId: string, memberIds: string[]): Promise<void> {
    await this.call(() => this.client.rpc('urb_add_group_members', { p_group: groupId, p_members: memberIds }));
  }

  async removeGroupMember(groupId: string, userId: string): Promise<void> {
    await this.call(() => this.client.rpc('urb_remove_group_member', { p_group: groupId, p_user: userId }));
  }

  async leaveGroup(groupId: string): Promise<void> {
    await this.call(() => this.client.rpc('urb_leave_group', { p_group: groupId }));
  }

  async deleteGroup(groupId: string): Promise<void> {
    await this.call(() => this.client.rpc('urb_delete_group', { p_group: groupId }));
  }

  async sendGroupMessage(groupId: string, body: string): Promise<number> {
    const id = await this.call(() => this.client.rpc('urb_send_group_message', { p_group: groupId, p_body: body }));
    if (id === null) throw new SocialError('unknown');
    return id;
  }

  async listGroupMessages(groupId: string, afterId = 0): Promise<GroupMessage[]> {
    const data = await this.call(() => this.client.rpc('urb_list_group_messages', { p_group: groupId, p_after: afterId }));
    return parseGroupMessages(data);
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
