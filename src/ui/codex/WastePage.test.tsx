import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DIFFICULTIES, SANCTIONS, WASTE, WASTE_FACILITIES, WASTE_REQUIRED_FROM_CITIZENS, createBuilding, newGame, wasteCodexFigures, wasteReport, type Building, type Difficulty, type GameState } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { WastePage } from './WastePage';

const context = vi.hoisted(() => ({ state: null as GameState | null }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
}));

afterEach(() => prefsStore.getState().setLanguage('en'));

const HOUR = 3_600_000;
const home = (id: number, x: number, y: number, tier: number): Building => ({ ...createBuilding(id, 'home', x, y, 0), tier });
const place = (id: number, type: 'mound' | 'incinerator' | 'recyclingPlant', x: number, y: number): Building => createBuilding(id, type, x, y, 0);
const roadRow = (from: number, to: number, y: number) => Array.from({ length: to - from + 1 }, (_, index) => ({ x: from + index, y, kind: 'road' as const }));

const render = (buildings: Building[], extra: Partial<GameState> = {}) => {
  context.state = { ...newGame({ seed: 'waste-page', now: 0 }), buildings, nextId: 1000, urbs: 1_000_000, tutorial: null, roads: roadRow(40, 80, 49), roundabouts: [], pedestrianWays: [], adaptationUntil: 0, ...extra };
  return renderToStaticMarkup(<WastePage />).replaceAll('&#x27;', "'");
};

const served = [place(1, 'incinerator', 60, 47), home(10, 62, 50, 4), home(11, 20, 50, 4)];

describe('WastePage', () => {
  it.each(['en', 'fr'] as const)('shows every section with no placeholder left in %s', language => {
    prefsStore.getState().setLanguage(language);
    const html = render(served);
    for (const key of ['codex.waste.title', 'codex.waste.production', 'codex.waste.allocation', 'codex.waste.coverage', 'codex.waste.pedestrian', 'codex.waste.nuisances', 'codex.waste.sanction', 'codex.waste.total'] as const) expect(html).toContain(t(key));
    expect(html).not.toContain('{');
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('undefined');
  });

  it('shows the figures of the core report', () => {
    const html = render(served);
    const report = wasteReport(context.state!);
    expect(html).toContain(report.produced.toFixed(1));
    expect(html).toContain(report.costPerDay.toFixed(1));
    expect(wasteCodexFigures(context.state!).uncoveredHomes).toBe(1);
  });

  it('lists the facilities from clean to dirty', () => {
    const html = render(served);
    const positions = ['recyclingPlant', 'incinerator', 'mound'].map(kind => html.indexOf(`>${t(`building.${kind}` as 'building.mound')}<`));
    expect(positions.every(position => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it('names the cause of the uncovered Homes', () => {
    const html = render(served);
    expect(html).toContain(t('home.reason.outOfReach'));
  });

  it('says so when every Home is covered', () => {
    expect(render([place(1, 'incinerator', 60, 47), home(10, 62, 50, 4)])).toContain(t('codex.waste.noUncovered'));
  });

  it('shows the Carrying distance, the surcharge and the share of the cost it causes', () => {
    const html = render([place(1, 'incinerator', 66, 47), home(10, 71, 53, 1)], { pedestrianWays: Array.from({ length: 4 }, (_, index) => ({ x: 70, y: 50 + index })) });
    expect(html).toContain(`>${WASTE.carryingDistance}<`);
    expect(html).toContain(`×${WASTE.carriedSurcharge}`);
    expect(html).toContain(`${Math.round((1 - 1 / WASTE.carriedSurcharge) * 100)}%`);
  });

  it('shows the nuisance figures of the Balance', () => {
    const html = render(served);
    expect(html).toContain(`>${WASTE_FACILITIES.mound.odor!.radius}<`);
    expect(html).toContain(`>${WASTE_FACILITIES.incinerator.pollution!.malus}<`);
  });

  it('says a facility without Urbs is stopped', () => {
    expect(render(served, { urbs: 0 })).toContain(t('codex.waste.stopped.noUrbs'));
  });

  it('says a Recycling plant without power is stopped, from the core result', () => {
    expect(render([place(1, 'recyclingPlant', 60, 47), home(10, 62, 50, 4)])).toContain(t('codex.waste.stopped.powerShortage'));
  });

  it('does not say it is stopped during the Adaptation period', () => {
    expect(render([place(1, 'recyclingPlant', 60, 47), home(10, 62, 50, 4)], { adaptationUntil: 10 * HOUR })).not.toContain(t('codex.waste.stopped.powerShortage'));
  });

  it.each(DIFFICULTIES)('highlights %s and marks the Difficulties that sanction Waste', (difficulty: Difficulty) => {
    const html = render(served, { difficulty });
    expect(html).toMatch(new RegExp(`aria-current="true">${t(`difficulty.${difficulty}`)}<`));
    expect(html.match(/✓/g)?.length ?? 0).toBe(DIFFICULTIES.filter(candidate => SANCTIONS[candidate].factors.includes('waste')).length);
  });

  it('says so during the Adaptation period', () => {
    const html = render(served, { difficulty: 'easy', adaptationUntil: 10 * HOUR });
    expect(html).toContain(t('codex.waste.adapting').replace('{hours}', '10.0'));
  });

  it('says Waste is not required in a small city', () => {
    expect(render([home(10, 62, 50, 1)])).toContain(t('codex.waste.notRequired').replace('{citizens}', String(WASTE_REQUIRED_FROM_CITIZENS)));
  });
});
