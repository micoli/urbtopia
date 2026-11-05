import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { ORDINANCE_ENTRIES } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { RecurringCostsPage } from './RecurringCostsPage';

afterEach(() => prefsStore.getState().setLanguage('en'));

describe('RecurringCostsPage', () => {
  it.each(['en', 'fr'] as const)('lists boats, transit and Ordinances in %s', (language) => {
    prefsStore.getState().setLanguage(language);
    const html = renderToStaticMarkup(<RecurringCostsPage />).replaceAll('&#x27;', "'");
    for (const key of ['codex.cost.boats', 'codex.cost.transit', 'codex.cost.ordinances'] as const) expect(html).toContain(t(key));
    expect(html).toContain(t('boat.pleasure'));
    expect(html).toContain(t('codex.cost.busLine'));
    expect(html).toContain(t(`ordinance.${ORDINANCE_ENTRIES[0]!.id}.name` as Parameters<typeof t>[0]));
  });
});
