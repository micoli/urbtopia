import { describe, expect, it } from 'vitest';
import { newGame, totalCitizens, type GameState } from '../core';
import { CURRENT_VERSION, parseEnvelope, serializeEnvelope } from '../persistence/envelope';
import { FakeShowcaseClient } from './fakeShowcaseClient';
import { loadShowcaseClient } from './loadShowcaseClient';
import { parseHallOfFame, parseShowcase } from './parseHallOfFame';
import { showcaseContent } from './showcaseEnvelope';
import { ShowcasePublisher } from './showcasePublisher';
import { toShowcaseError } from './supabaseShowcaseClient';

const NOW = 1_700_000_000_000;
const city = newGame({ seed: 'showcase', now: NOW });
const cityWithLedger: GameState = { ...city, tradeLedger: [{ offerId: 'offer-1', effect: 'pay', at: NOW, confirmed: true } as unknown as GameState['tradeLedger'][number]] };
const local = serializeEnvelope(cityWithLedger, NOW);

function setup(overrides: { member?: boolean } = {}) {
  const client = new FakeShowcaseClient();
  client.member = overrides.member ?? true;
  const statuses: unknown[] = [];
  const publisher = new ShowcasePublisher({
    client,
    isMember: () => client.member,
    cityName: () => 'My Town',
    readLocal: () => local,
    onStatus: (status) => statuses.push(status),
  });
  return { client, publisher, statuses };
}

describe('loadShowcaseClient', () => {
  it('returns null without configuration, so supabase-js is never imported', async () => {
    expect(await loadShowcaseClient('c1', {})).toBeNull();
  });
});

describe('toShowcaseError', () => {
  it.each([
    ['urb_notice_required', 'notice-required'],
    ['urb_handle_required', 'handle-required'],
    ['urb_email_required', 'email-required'],
    ['urb_too_large', 'too-large'],
    ['urb_not_found', 'not-found'],
    ['boom', 'unknown'],
  ])('maps %s to %s', (message, kind) => {
    expect(toShowcaseError({ message, code: 'P0001' }).kind).toBe(kind);
  });

  it('reads a network failure as offline', () => {
    expect(toShowcaseError({ message: 'Failed to fetch', code: '' }).kind).toBe('offline');
  });
});

describe('showcaseContent', () => {
  it('drops the trade ledger and keeps the rest of the city', () => {
    const content = showcaseContent(local);
    const parsed = parseEnvelope(content?.envelope ?? '');
    expect(parsed.ok && parsed.state.tradeLedger).toEqual([]);
    expect(parsed.ok && parsed.state.seed).toBe(city.seed);
  });

  it('counts the Citizens and states the current format', () => {
    expect(showcaseContent(local)).toMatchObject({ citizens: totalCitizens(city), formatVersion: CURRENT_VERSION });
  });

  it('refuses an envelope that is not a valid save', () => {
    expect(showcaseContent('{}')).toBeNull();
  });
});

describe('parsers', () => {
  it('reads the ranking', () => {
    const row = { rank: 1, userId: 'u', cityId: 'c1', cityName: 'Alice Harbour', handle: 'Alice', avatar: null, citizens: 12 };
    expect(parseHallOfFame([row])).toEqual([row]);
  });

  it('refuses a malformed ranking', () => {
    expect(() => parseHallOfFame([{ rank: 'one' }])).toThrow();
    expect(() => parseHallOfFame([{ rank: 1, userId: 'u', handle: 'Alice', avatar: null, citizens: 12 }])).toThrow();
    expect(() => parseHallOfFame({})).toThrow();
  });

  it('hands the Showcase envelope back as text', () => {
    const showcase = parseShowcase({ cityName: 'Alice Harbour', handle: 'Alice', avatar: 'character-male-a', formatVersion: 16, envelope: { a: 1 } });
    expect(JSON.parse(showcase.envelope)).toEqual({ a: 1 });
    expect(showcase.cityName).toBe('Alice Harbour');
  });
});

describe('ShowcasePublisher', () => {
  it('publishes nothing before the notice has been seen', async () => {
    const { client, publisher } = setup();
    await publisher.publish(local);
    expect(client.published).toEqual([]);
    expect(publisher.status).toEqual({ optedOut: false, noticeSeen: false });
  });

  it('publishes the city without its trade ledger once the notice is seen', async () => {
    const { client, publisher } = setup();
    await publisher.loadStatus();
    await publisher.acknowledgeNotice();
    expect(client.published).toHaveLength(1);
    const parsed = parseEnvelope(client.published[0]?.envelope ?? "");
    expect(parsed.ok && parsed.state.tradeLedger).toEqual([]);
    expect(client.published[0]?.citizens).toBe(totalCitizens(city));
  });

  it('publishes under the name of the open City', async () => {
    const { client, publisher } = setup();
    await publisher.loadStatus();
    await publisher.acknowledgeNotice();
    expect(client.published[0]?.cityName).toBe('My Town');
  });

  it('publishes nothing for an account without a Handle', async () => {
    const { client, publisher } = setup({ member: false });
    await publisher.publish(local);
    expect(client.published).toEqual([]);
    expect(publisher.status).toBeNull();
  });

  it('stays silent once the player opted out, and publishes again when they opt back in', async () => {
    const { client, publisher } = setup();
    await publisher.setOptOut(true);
    await publisher.publish(local);
    expect(client.published).toEqual([]);
    await publisher.setOptOut(false);
    expect(client.published).toHaveLength(1);
  });

  it('never throws when the server is unreachable', async () => {
    const { client, publisher } = setup();
    await publisher.acknowledgeNotice();
    client.offline = true;
    await expect(publisher.publish(local)).resolves.toBeUndefined();
  });

  it('asks for the notice again when the server says it was not seen', async () => {
    const { client, publisher } = setup();
    await publisher.acknowledgeNotice();
    client.statusValue = { optedOut: false, noticeSeen: false };
    await publisher.publish(local);
    expect(publisher.status).toEqual({ optedOut: false, noticeSeen: false });
  });

  it('keeps only the latest city while a publication is running', async () => {
    const { client, publisher } = setup();
    await publisher.acknowledgeNotice();
    client.published = [];
    await Promise.all([publisher.publish(local), publisher.publish(local), publisher.publish(local)]);
    expect(client.published.length).toBeLessThanOrEqual(2);
    expect(client.published.length).toBeGreaterThanOrEqual(1);
  });
});

describe('ShowcasePublisher status', () => {
  it('asks the server once while a status request is running', async () => {
    const { client, publisher } = setup();
    let calls = 0;
    const original = client.status.bind(client);
    client.status = () => {
      calls += 1;
      return original();
    };
    await Promise.all([publisher.loadStatus(), publisher.loadStatus(), publisher.loadStatus()]);
    expect(calls).toBe(1);
  });
});
