import { beforeEach, describe, expect, it } from 'vitest';
import { socialStore } from '../store/socialStore';
import { FakeSocialWorld } from './fakeSocialClient';
import { createGroupActions } from './groupActions';
import type { SocialClient } from './types';

function setup() {
  socialStore.setState({ groups: null, groupsRevision: null, groupConversation: null, groupBusy: false, groupFailure: null });
  const world = new FakeSocialWorld(() => 0);
  const alice = world.addPlayer('a', undefined, 'Alice');
  const bob = world.addPlayer('b', undefined, 'Bob');
  const carol = world.addPlayer('c', undefined, 'Carol');
  world.upsert('a', 'b', 'accepted', 'a');
  world.upsert('a', 'c', 'accepted', 'a');
  const make = (client: SocialClient) => createGroupActions(
    client,
    socialStore.getState(),
    { groups: () => socialStore.getState().groups, revision: () => socialStore.getState().groupsRevision, conversation: () => socialStore.getState().groupConversation },
    async () => {},
  );
  return { world, alice, bob, carol, actions: make(alice), bobActions: make(bob) };
}

const groupsOf = () => socialStore.getState().groups ?? [];

describe('group actions with the fake client', () => {
  beforeEach(() => socialStore.setState({ groups: null }));

  it('creates a Group and lists it with its members', async () => {
    const { actions } = setup();
    expect(await actions.create('Builders', ['b', 'c'])).toBe(true);
    expect(groupsOf()).toHaveLength(1);
    expect(groupsOf()[0]).toMatchObject({ name: 'Builders', creatorId: 'a' });
    expect(groupsOf()[0]!.members.map((member) => member.handle)).toEqual(['Alice', 'Bob', 'Carol']);
    expect(socialStore.getState()).toMatchObject({ groupBusy: false, groupFailure: null });
  });

  it('keeps the failure of a refused Group for the form', async () => {
    const { actions } = setup();
    expect(await actions.create('ab', ['b'])).toBe(false);
    expect(socialStore.getState().groupFailure).toMatchObject({ error: 'group-name-invalid' });
    expect(await actions.create('Builders', ['stranger'])).toBe(false);
    expect(socialStore.getState().groupFailure).toMatchObject({ error: 'not-friends' });
  });

  it('opens a Group, sends a message and shows it to the others as unread', async () => {
    const { actions, bobActions } = setup();
    await actions.create('Builders', ['b']);
    const id = groupsOf()[0]!.id;
    await actions.open(id);
    await actions.send('  Hello team ');
    expect(socialStore.getState().groupConversation?.messages.map((message) => message.body)).toEqual(['Hello team']);
    await bobActions.refresh();
    expect(groupsOf()[0]).toMatchObject({ unread: 1, lastMessagePreview: 'Hello team', lastMessageFrom: 'Alice' });
  });

  it('polls only what changed and picks up new messages of the open Group', async () => {
    const { actions, bob } = setup();
    await actions.create('Builders', ['b']);
    const id = groupsOf()[0]!.id;
    await actions.open(id);
    const revision = socialStore.getState().groupsRevision;
    await actions.poll();
    expect(socialStore.getState().groupsRevision).toBe(revision);
    await bob.sendGroupMessage(id, 'from Bob');
    await actions.pollOpen();
    await actions.poll();
    expect(socialStore.getState().groupConversation?.messages.map((message) => message.body)).toEqual(['from Bob']);
    expect(groupsOf()[0]!.unread).toBe(0);
  });

  it('renames, adds and removes members, and closes a Group the player left', async () => {
    const { actions, bobActions } = setup();
    await actions.create('Builders', ['b']);
    const id = groupsOf()[0]!.id;
    expect(await actions.rename(id, 'Masons')).toBe(true);
    expect(groupsOf()[0]!.name).toBe('Masons');
    expect(await actions.addMembers(id, ['c'])).toBe(true);
    expect(groupsOf()[0]!.members).toHaveLength(3);
    await actions.removeMember(id, 'c');
    expect(groupsOf()[0]!.members).toHaveLength(2);
    await bobActions.refresh();
    await bobActions.open(id);
    await bobActions.leave(id);
    expect(socialStore.getState().groupConversation).toBeNull();
    expect(groupsOf()).toHaveLength(0);
  });

  it('refuses a member renaming, and a creator leaving', async () => {
    const { actions, bobActions } = setup();
    await actions.create('Builders', ['b']);
    const id = groupsOf()[0]!.id;
    await bobActions.refresh();
    expect(await bobActions.rename(id, 'Hijack')).toBe(false);
    expect(socialStore.getState().groupFailure).toMatchObject({ error: 'not-creator' });
    await actions.leave(id);
    expect(socialStore.getState().groupFailure).toMatchObject({ error: 'group-creator-cannot-leave' });
  });

  it('deletes a Group and closes it', async () => {
    const { actions } = setup();
    await actions.create('Builders', ['b']);
    const id = groupsOf()[0]!.id;
    await actions.open(id);
    await actions.remove(id);
    expect(groupsOf()).toHaveLength(0);
    expect(socialStore.getState().groupConversation).toBeNull();
  });

  it('removes a member who stops being a Friend of the creator', async () => {
    const { actions, bobActions, world } = setup();
    await actions.create('Builders', ['b']);
    world.remove('a', 'b', 'accepted');
    await bobActions.refresh();
    expect(groupsOf()).toHaveLength(0);
    await actions.refresh();
    expect(groupsOf()[0]!.members).toHaveLength(1);
  });

  it('hides the messages of an author the reader blocked', async () => {
    const { actions, bobActions, carol, bob } = setup();
    await actions.create('Builders', ['b', 'c']);
    const id = groupsOf()[0]!.id;
    await carol.sendGroupMessage(id, 'from Carol');
    await bobActions.refresh();
    await bobActions.open(id);
    expect(socialStore.getState().groupConversation?.messages).toHaveLength(1);
    await bobActions.blockMember('c');
    expect(socialStore.getState().groupConversation?.messages).toHaveLength(0);
    await actions.open(id);
    expect(socialStore.getState().groupConversation?.messages).toHaveLength(1);
    expect(await bob.listGroupMessages(id)).toHaveLength(0);
  });

  it('counts Group messages in the sending cap shared with Messages', async () => {
    const { actions, alice } = setup();
    await actions.create('Builders', ['b']);
    const id = groupsOf()[0]!.id;
    for (let i = 0; i < 30; i += 1) await alice.sendGroupMessage(id, `m${i}`);
    await expect(alice.sendMessage('b', 'one more')).rejects.toMatchObject({ kind: 'rate-limited' });
  });
});
