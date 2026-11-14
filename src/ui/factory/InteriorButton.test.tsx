import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { createBuilding, newGame, type GameState } from '../../core';
import { t } from '../../i18n/t';
import { InteriorButton } from './InteriorButton';

const context = vi.hoisted(() => ({ state: null as GameState | null }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
}));

const homes = [10, 11, 12, 13].map(id => ({ ...createBuilding(id, 'home', 40 + id, 30, 0), tier: 6 }));

describe('InteriorButton', () => {
  it('opens the interior of a Workshop once the city has the Citizens it needs', () => {
    const workshop = createBuilding(1, 'workshop', 55, 50, 0);
    context.state = { ...newGame({ seed: 'interior-button', now: 0 }), buildings: [...homes, workshop] };
    const html = renderToStaticMarkup(<InteriorButton building={workshop} />);
    expect(html).toContain(t('interior.open.workshop'));
    expect(html).not.toContain('disabled=""');
  });

  it('shows the button locked in a city that is too small', () => {
    const workshop = createBuilding(1, 'workshop', 55, 50, 0);
    context.state = { ...newGame({ seed: 'interior-button', now: 0 }), buildings: [workshop] };
    expect(renderToStaticMarkup(<InteriorButton building={workshop} />)).toContain('disabled=""');
  });
});
