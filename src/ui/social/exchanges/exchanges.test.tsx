import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { t } from '../../../i18n/t';
import type { SocialState, TradeOffer } from '../../../social/types';
import { ExchangesPanel } from './ExchangesPanel';
import { OfferCard } from './OfferCard';
import { offerGroup, offerStatusKey } from './offerStatus';
import { tradeFailureMessage } from './tradeFailureMessage';

const noop = () => {};
const asyncNoop = async () => true;

const offer = (change: Partial<TradeOffer> = {}): TradeOffer => ({
  id: 'o1', role: 'recipient', peerId: 'a', peerHandle: 'Alice', peerAvatar: null, lot: [{ item: 'wood', quantity: 4 }], price: 30, state: 'open',
  createdAt: 0, expiresAt: 1, claimDeadline: null, claimable: [], claimed: [], ...change,
});

const profile = (offers: TradeOffer[], friends: SocialState['friends'] = [{ userId: 'a', handle: 'Alice', avatar: null, since: 0, unread: 0, lastMessageAt: null }]): SocialState => ({
  revision: 1, handle: 'Bob', avatar: null, findable: true, handleChangedAt: 0, friends, incoming: [], outgoing: [], blocked: [], offers,
});

const panel = (props: Partial<Parameters<typeof ExchangesPanel>[0]> = {}) =>
  renderToStaticMarkup(
    <ExchangesPanel profile={profile([])} stock={[{ item: 'wood', quantity: 10 }]} initialFriendId={null} busy={false} failure={null} acceptIssueOf={() => null} onCreate={asyncNoop} onAccept={noop} onDecline={noop} {...props} />,
  );

describe('offer groups and status', () => {
  it.each([
    ['an open offer received', offer(), 'received', 'exchanges.status.open-recipient'],
    ['an open offer sent', offer({ role: 'sender' }), 'sent', 'exchanges.status.open-sender'],
    ['an accepted offer waiting for the Lot', offer({ state: 'accepted', claimable: ['lot'] }), 'progress', 'exchanges.status.accepted-recipient'],
    ['an accepted offer whose Lot is received', offer({ state: 'accepted', claimed: ['lot'] }), 'finished', 'exchanges.status.accepted-recipient'],
    ['an accepted offer waiting for the payment', offer({ role: 'sender', state: 'accepted' }), 'progress', 'exchanges.status.accepted-sender'],
    ['a paid offer', offer({ role: 'sender', state: 'accepted', claimed: ['payment'] }), 'finished', 'exchanges.status.accepted-sender'],
    ['a refused offer whose Lot is coming back', offer({ role: 'sender', state: 'refused', claimable: ['lot'] }), 'progress', 'exchanges.status.returning-sender'],
    ['a refused offer whose Lot is back', offer({ role: 'sender', state: 'refused', claimed: ['lot'] }), 'finished', 'exchanges.status.returning-sender'],
    ['a refused offer seen by its recipient', offer({ state: 'refused' }), 'finished', 'exchanges.status.returning-recipient'],
    ['a lapsed offer whose payment returns', offer({ state: 'lapsed', claimable: ['payment'] }), 'progress', 'exchanges.status.returning-recipient'],
  ] as const)('%s', (_label, value, group, key) => {
    expect(offerGroup(value)).toBe(group);
    expect(offerStatusKey(value)).toBe(key);
  });
});

describe('offer card', () => {
  const card = (value: TradeOffer, issue: Parameters<typeof OfferCard>[0]['acceptIssue'] = null) =>
    renderToStaticMarkup(<OfferCard offer={value} acceptIssue={issue} busy={false} onAccept={noop} onDecline={noop} />);

  it('offers Accept and Refuse on a received offer, with the price and the sender', () => {
    const html = card(offer());
    expect(html).toContain(t('exchanges.accept'));
    expect(html).toContain(t('exchanges.refuse'));
    expect(html).toContain(t('exchanges.from').replace('{H}', 'Alice'));
    expect(html).toContain(t('exchanges.price').replace('{P}', '30'));
    expect(html).toContain('4 × ');
  });

  it('disables Accept and says why when the room, the Urbs or the Unlock are missing', () => {
    const html = card(offer(), 'error.storageFull');
    expect(html).toMatch(/<button[^>]*disabled[^>]*>[^<]*Accept|<button[^>]*disabled[^>]*>[^<]*Accepter/);
    expect(html).toContain(t('error.storageFull'));
  });

  it('shows a gift as a gift and lets the sender cancel an open offer', () => {
    const html = card(offer({ role: 'sender', price: 0 }));
    expect(html).toContain(t('exchanges.gift'));
    expect(html).toContain(t('exchanges.cancel'));
    expect(html).not.toContain(t('exchanges.accept'));
  });
});

describe('exchanges panel', () => {
  it('asks for a Handle first', () => {
    expect(panel({ profile: null })).toContain(t('exchanges.locked'));
  });

  it('asks to add a friend, or to fill the storage, before offering', () => {
    expect(panel({ profile: profile([], []) })).toContain(t('exchanges.noFriends'));
    expect(panel({ stock: [] })).toContain(t('exchanges.noStock'));
  });

  it('shows the form with the friends and the stock, and no offer yet', () => {
    const html = panel();
    expect(html).toContain(t('exchanges.new'));
    expect(html).toContain('<span>Alice</span>');
    expect(html).toContain('role="combobox"');
    expect(html).not.toContain('<select');
    expect(html).toContain(t('exchanges.available').replace('{N}', '10'));
    expect(html).toContain(t('exchanges.none'));
  });

  it('groups received, sent and in progress offers, and hides the finished ones', () => {
    const html = panel({
      profile: profile([
        offer({ id: 'r' }), offer({ id: 's', role: 'sender', peerHandle: 'Carol' }),
        offer({ id: 'p', state: 'accepted', claimable: ['lot'], peerHandle: 'Dave' }), offer({ id: 'f', state: 'accepted', claimed: ['lot'], peerHandle: 'Erin' }),
      ]),
    });
    expect(html).toContain(t('exchanges.received'));
    expect(html).toContain(t('exchanges.sent'));
    expect(html).toContain(t('exchanges.inProgress'));
    expect(html).toContain('Dave');
    expect(html).not.toContain('Erin');
    expect(html).not.toContain(t('exchanges.none'));
  });

  it('shows the failure of the last attempt', () => {
    expect(panel({ failure: { kind: 'social', error: 'cap-trades-open', retryAfterSeconds: null } })).toContain(t('exchanges.error.cap-trades-open'));
  });
});

describe('trade failure messages', () => {
  it('turns every kind of failure into a message', () => {
    expect(tradeFailureMessage({ kind: 'game', key: 'error.notEnoughUrbs' })).toBe(t('error.notEnoughUrbs'));
    expect(tradeFailureMessage({ kind: 'read-only' })).toBe(t('exchanges.error.read-only'));
    expect(tradeFailureMessage({ kind: 'social', error: 'rate-limited', retryAfterSeconds: 125 })).toBe(t('exchanges.error.rate-limited').replace('{N}', '3'));
    expect(tradeFailureMessage({ kind: 'social', error: 'offline', retryAfterSeconds: null })).toBe(t('friends.error.offline'));
    expect(tradeFailureMessage({ kind: 'social', error: 'unauthenticated', retryAfterSeconds: null })).toBe(t('friends.error.unknown'));
  });
});
