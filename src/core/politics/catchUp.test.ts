import { describe, expect, it } from 'vitest';
import { advance, approvalOf, dispatch, GAME_CONFIG, POLITICS, termDaysLeft, type GameState } from '../index';
import { toastKeyForEvents } from '../../store/toastStore';
import { DAY, T0, adaptingCity, politicalCity, withApproval } from './testSupport';

const matured = (state: GameState): GameState => ({ ...state, adaptationUntil: 0, politics: { ...state.politics!, adaptationUntilDay: 0 } });

describe('Catch-up of the politics', () => {
  it('plays the days of an absence one by one, Objectives and Petitions included', () => {
    const city = matured(politicalCity());
    const played = advance(city, T0 + 2 * DAY).state;
    expect(played.politics!.day).toBe(city.politics!.day + 2);
    expect(played.politics!.journal.length).toBeGreaterThan(0);
  });

  it('keeps the same state in one go as in steps, journal included', () => {
    const city = matured(politicalCity());
    const oneGo = advance(city, T0 + 2 * DAY).state;
    const steps = advance(advance(city, T0 + DAY / 2).state, T0 + 2 * DAY).state;
    expect(JSON.stringify(steps.politics)).toBe(JSON.stringify(oneGo.politics));
  });

  it('does not play the days of an absence beyond the offline cap, as for the rest of the city', () => {
    const city = withApproval(politicalCity('medium'), 100);
    const capped = advance(city, T0 + 5 * DAY).state;
    const capDays = Math.round(GAME_CONFIG.offlineCapMs / DAY);
    const played = advance(city, T0 + capDays * DAY).state;
    expect(capped.politics!.approval).toBeCloseTo(played.politics!.approval, 9);
    expect(capped.politics!.day).toBe(city.politics!.day + 5);
    expect(termDaysLeft(capped.politics!, capped.politics!.day)).toBe(termDaysLeft(played.politics!, played.politics!.day));
    expect(advance(capped, capped.lastSeen + 1000).state.politics!.approval).toBeCloseTo(capped.politics!.approval, 9);
  });

  it('tells the player that the politics moved, with a toast', () => {
    const city = matured(politicalCity());
    const { events, state } = advance(city, T0 + 2 * DAY);
    const digest = events.find(event => event.type === 'PoliticsDigest');
    expect(digest).toEqual({ type: 'PoliticsDigest', entries: state.politics!.journal.length });
    expect(toastKeyForEvents(events)).toBe('event.politicsDigest');
  });

  it('says nothing when nothing happened', () => {
    const city = politicalCity();
    expect(advance(city, T0 + DAY / 4).events.some(event => event.type === 'PoliticsDigest')).toBe(false);
  });

  it('keeps only the latest entries of the journal', () => {
    let city = matured(politicalCity());
    for (let day = 0; day < 30; day++) city = advance(city, city.lastSeen + DAY / 2).state;
    expect(city.politics!.journal.length).toBeLessThanOrEqual(POLITICS.journalSize);
  });

  it('is replayed by a Time skip as by the same time spent playing', () => {
    const city = matured(politicalCity());
    const skipped = dispatch(city, { type: 'SkipTime', hours: 24 }, T0);
    if (!skipped.ok) throw new Error(skipped.error.key);
    const played = advance(city, T0 + DAY).state;
    expect(skipped.state.politics!.day).toBe(played.politics!.day);
    expect(skipped.state.politics!.petitions).toEqual(played.politics!.petitions);
    expect(skipped.state.politics!.objectives).toEqual(played.politics!.objectives);
  });
});

describe('Adaptation period', () => {
  const adapting = (): GameState => withApproval(adaptingCity('medium'), 100);

  it('starts with the politics and lasts the balanced number of days', () => {
    expect(adapting().politics!.adaptationUntilDay).toBe(adapting().politics!.day + POLITICS.adaptationDays);
  });

  it('lets the Approval rise but never fall', () => {
    const city = adapting();
    const next = advance(city, T0 + DAY).state;
    expect(approvalOf(next)).toBeGreaterThanOrEqual(100 - 1e-9);
  });

  it('lets the Approval fall once it is over', () => {
    const city = matured(adapting());
    expect(approvalOf(advance(city, T0 + DAY).state)).toBeLessThan(100);
  });

  it('files no Demonstration', () => {
    const city = adapting();
    const ignored = { ...city, adaptationUntil: 0, politics: { ...city.politics!, petitions: [{ id: 1, cause: 'electricity' as const, parcel: { x: 0, y: 0 }, since: 0, escalated: false }], nextPetitionId: 2 } };
    expect(advance(ignored, T0 + DAY).state.politics!.petitions.find(petition => petition.cause === 'electricity')?.escalated).toBe(false);
  });

  it('spares the Mayor the penalty of repealing a popular Ordinance', () => {
    const adopted = dispatch({ ...adapting(), politics: { ...adapting().politics!, adopted: ['transitSubsidy'] } }, { type: 'RepealOrdinance', id: 'transitSubsidy' }, T0);
    if (!adopted.ok) throw new Error(adopted.error.key);
    expect(adopted.state.politics!.shock).toBe(0);
  });
});
