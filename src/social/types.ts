export type SocialErrorKind =
  | 'offline'
  | 'unauthenticated'
  | 'email-required'
  | 'handle-required'
  | 'handle-invalid'
  | 'handle-forbidden'
  | 'handle-taken'
  | 'handle-change-too-soon'
  | 'rate-limited'
  | 'message-invalid'
  | 'not-friends'
  | 'cap-friends'
  | 'cap-outgoing'
  | 'not-found'
  | 'unknown';

export class SocialError extends Error {
  constructor(
    readonly kind: SocialErrorKind,
    readonly retryAfterSeconds: number | null = null,
  ) {
    super(`social-${kind}`);
  }
}

export interface Friend {
  userId: string;
  handle: string;
  since: number;
  unread: number;
  lastMessageAt: number | null;
}

export interface Message {
  id: number;
  fromMe: boolean;
  body: string;
  at: number;
}

export interface FriendRequest {
  userId: string;
  handle: string;
  at: number;
}

export interface BlockedPlayer {
  userId: string;
  handle: string;
}

export interface SocialState {
  revision: number;
  handle: string;
  findable: boolean;
  handleChangedAt: number;
  friends: Friend[];
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
  blocked: BlockedPlayer[];
}

export type SocialSnapshot = { changed: false; revision: number } | ({ changed: true } & SocialState);

export interface SocialClient {
  setHandle(handle: string): Promise<void>;
  setFindable(findable: boolean): Promise<void>;
  sendRequestByEmail(email: string): Promise<void>;
  acceptRequest(userId: string): Promise<void>;
  refuseRequest(userId: string): Promise<void>;
  removeFriend(userId: string): Promise<void>;
  block(userId: string): Promise<void>;
  unblock(userId: string): Promise<void>;
  list(cursor?: number | null): Promise<SocialSnapshot>;
  sendMessage(userId: string, body: string): Promise<number>;
  listMessages(userId: string, afterId?: number): Promise<Message[]>;
}
