import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBuilding, newGame, type Building, type GameState } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { SelectionContentPanel } from './SelectionContentPanel';

const context = vi.hoisted(() => ({ state: null as GameState | null, building: null as Building | null }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
  useUi: (selector: (store: Record<string, unknown>) => unknown) => selector(new Proxy({}, { get: () => () => {} })),
  useReadOnly: () => false,
}));
vi.mock('./useSelectedBuilding', () => ({ useSelectedBuilding: () => context.building }));
vi.mock('../../store/gameStore', () => ({ gameStore: { getState: () => ({ send: () => {} }), subscribe: () => () => {} } }));

afterEach(() => prefsStore.getState().setLanguage('en'));

function render(type: 'casino' | 'workshop', tier = 1): string {
  const building = { ...createBuilding(1, type, 55, 50, 0), tier };
  context.building = building;
  context.state = { ...newGame({ seed: 'selection-panel', now: 0 }), buildings: [building], urbs: 100_000, adaptationUntil: 0, tutorial: null };
  return renderToStaticMarkup(<SelectionContentPanel />);
}

describe('selected building panel', () => {
  it('has Usage, Modifications and Help sections, in that order', () => {
    const html = render('casino');
    const positions = ['usage', 'modifications', 'help'].map((id) => html.indexOf(`id="panel-section-${id}-toggle"`));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(html).toContain(t('panel.section.modifications'));
    expect(html).toContain(t('panel.section.usage'));
    expect(html).toContain(t('panel.section.help'));
  });

  it('opens every section by default', () => {
    const html = render('casino');
    expect(html.match(/aria-expanded="true"/g)).toHaveLength(3);
    expect(html).not.toContain('aria-expanded="false"');
  });

  it('puts the Minigames in Usage, rotate, move, the upgrade and Sell in Modifications, and the Codex link in Help', () => {
    const html = render('casino');
    const usage = html.indexOf('id="panel-section-usage"');
    const modifications = html.indexOf('id="panel-section-modifications"');
    const help = html.indexOf('id="panel-section-help"');
    const at = (text: string) => html.indexOf(text);
    expect(at(t('casino.slotMachine'))).toBeGreaterThan(usage);
    expect(at(t('casino.slotMachine'))).toBeLessThan(modifications);
    for (const text of [t('panel.rotateLeft'), t('panel.move'), `${t('home.upgrade')} → 2`, t('panel.sell')]) {
      expect(at(text)).toBeGreaterThan(modifications);
      expect(at(text)).toBeLessThan(help);
    }
    expect(at(t('codex.about').replace('{name}', t('building.casino')))).toBeGreaterThan(help);
  });

  it('shows no upgrade once the building is at its top Tier', () => {
    expect(render('casino', 3)).not.toContain(`${t('home.upgrade')} →`);
  });
});
