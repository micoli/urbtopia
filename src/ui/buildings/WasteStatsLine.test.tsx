import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { createBuilding, newGame } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { WasteStatsLine } from './WasteStatsLine';

afterEach(() => prefsStore.getState().setLanguage('en'));

describe('WasteStatsLine', () => {
  it('shows nothing without Homes', () => {
    expect(renderToStaticMarkup(<WasteStatsLine state={newGame({ seed: 'waste-line', now: 0 })} />)).toBe('');
  });

  it.each(['en', 'fr'] as const)('shows produced, processed and cost per day in %s', language => {
    prefsStore.getState().setLanguage(language);
    const state = { ...newGame({ seed: 'waste-line', now: 0 }), buildings: [createBuilding(900, 'home', 56, 59, 0)] };
    const html = renderToStaticMarkup(<WasteStatsLine state={state} />);
    for (const key of ['stats.waste', 'stats.waste.produced', 'stats.waste.processed', 'stats.waste.cost'] as const) expect(html).toContain(t(key));
    expect(html).not.toContain('NaN');
  });
});
