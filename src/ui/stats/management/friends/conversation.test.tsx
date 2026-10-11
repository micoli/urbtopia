import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { t } from '../../../../i18n/t';
import { FakeSocialWorld } from '../../../../social/fakeSocialClient';
import { createSocialActions } from '../../../../social/socialActions';
import { socialStore, type ConversationState } from '../../../../store/socialStore';
import { ConversationView } from './ConversationView';
import { FriendList } from './FriendList';
import { friendsErrorMessage } from './friendsErrorMessage';

const noop = () => {};

const conversation = (props: Partial<ConversationState> = {}): ConversationState => ({
  userId: 'b',
  handle: 'Bob',
  messages: [
    { id: 1, fromMe: false, body: 'Hello Alice', at: 0 },
    { id: 2, fromMe: true, body: 'Hi Bob', at: 1000 },
  ],
  loading: false,
  sending: false,
  failure: null,
  ...props,
});

describe('conversation view', () => {
  it('shows the Handle, both sides of the talk and the composer', () => {
    const html = renderToStaticMarkup(<ConversationView conversation={conversation()} onBack={noop} onSend={noop} />);
    expect(html).toContain('<h4>Bob</h4>');
    expect(html).toContain('Hello Alice');
    expect(html).toContain('data-from-me="true"');
    expect(html).toContain('maxLength="500"');
    expect(html).toContain(t('friends.conversation.back'));
  });

  it('invites to say hello in an empty Conversation', () => {
    expect(renderToStaticMarkup(<ConversationView conversation={conversation({ messages: [] })} onBack={noop} onSend={noop} />)).toContain(t('friends.conversation.empty'));
  });

  it('shows send errors, with the delay of a rate limit in seconds', () => {
    const failed = (error: 'not-friends' | 'message-invalid' | 'rate-limited', retryAfterSeconds: number | null) =>
      renderToStaticMarkup(<ConversationView conversation={conversation({ failure: { error, retryAfterSeconds } })} onBack={noop} onSend={noop} />);
    expect(failed('not-friends', null)).toContain(t('friends.error.not-friends'));
    expect(failed('message-invalid', null)).toContain(t('friends.error.message-invalid'));
    expect(failed('rate-limited', 42)).toContain(t('friends.error.message-rate-limited').replace('{N}', '42'));
    expect(friendsErrorMessage('rate-limited', 125)).toContain('3');
  });
});

describe('friend list with messages', () => {
  it('offers Message with the unread count', () => {
    const html = renderToStaticMarkup(<FriendList friends={[{ userId: 'b', handle: 'Bob', since: 0, unread: 3, lastMessageAt: 0 }]} onMessage={noop} onRemove={noop} onBlock={noop} />);
    expect(html).toContain(t('friends.message'));
    expect(html).toContain('>3<');
  });

  it('shows no count without unread messages', () => {
    const html = renderToStaticMarkup(<FriendList friends={[{ userId: 'b', handle: 'Bob', since: 0, unread: 0, lastMessageAt: null }]} onMessage={noop} onRemove={noop} onBlock={noop} />);
    expect(html).not.toContain('friends-unread');
  });
});

describe('conversation actions with the fake client', () => {
  async function pair() {
    const world = new FakeSocialWorld(() => 0);
    const alice = world.addPlayer('a');
    const bob = world.addPlayer('b', 'b@example.com');
    socialStore.setState({ status: 'idle', profile: null, conversation: null, handleForm: { kind: 'idle' }, search: { kind: 'idle' }, actionFailure: null });
    const store = socialStore.getState();
    const read = () => socialStore.getState().conversation;
    const revision = () => socialStore.getState().profile?.revision ?? null;
    const aliceActions = createSocialActions(alice, store, revision, read);
    const bobActions = createSocialActions(bob, { ...store, setConversation: () => {}, setProfile: () => {}, setStatus: () => {} });
    await aliceActions.setHandle('Alice');
    await bobActions.setHandle('Bob');
    await aliceActions.sendRequest('b@example.com');
    await bobActions.accept('a');
    await aliceActions.refresh();
    return { aliceActions, bob, alice };
  }

  it('opens a Conversation, sends a message and shows it', async () => {
    const { aliceActions } = await pair();
    await aliceActions.openConversation('b', 'Bob');
    expect(socialStore.getState().conversation).toMatchObject({ userId: 'b', handle: 'Bob', messages: [], loading: false });
    await aliceActions.sendMessage('  Hello  ');
    expect(socialStore.getState().conversation).toMatchObject({ sending: false, failure: null, messages: [{ body: 'Hello', fromMe: true }] });
  });

  it('picks up new messages from the Friend while the Conversation is open', async () => {
    const { aliceActions, bob } = await pair();
    await aliceActions.openConversation('b', 'Bob');
    await bob.sendMessage('a', 'Ping');
    await aliceActions.pollConversation();
    await aliceActions.pollConversation();
    expect(socialStore.getState().conversation?.messages).toMatchObject([{ body: 'Ping', fromMe: false }]);
  });

  it('shows unread messages on the Friend and clears them once the Conversation is open', async () => {
    const { aliceActions, bob } = await pair();
    await bob.sendMessage('a', 'Hey');
    await aliceActions.poll();
    expect(socialStore.getState().profile?.friends[0]).toMatchObject({ unread: 1 });
    await aliceActions.openConversation('b', 'Bob');
    expect(socialStore.getState().profile?.friends[0]).toMatchObject({ unread: 0 });
  });

  it('keeps the error of a refused message and ignores blank ones', async () => {
    const { aliceActions } = await pair();
    await aliceActions.openConversation('b', 'Bob');
    await aliceActions.sendMessage('   ');
    expect(socialStore.getState().conversation?.messages).toEqual([]);
    await aliceActions.sendMessage('x'.repeat(501));
    expect(socialStore.getState().conversation?.failure).toMatchObject({ error: 'message-invalid' });
  });

  it('goes back to the list and refreshes the unread counts', async () => {
    const { aliceActions } = await pair();
    await aliceActions.openConversation('b', 'Bob');
    await aliceActions.closeConversation();
    expect(socialStore.getState().conversation).toBeNull();
  });
});
