import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { t } from '../../i18n/t';
import { CasinoLedger } from './CasinoLedger';

describe('casino ledger', () => {
  it('shows what was spent, what was won and the balance', () => {
    const html = renderToStaticMarkup(<CasinoLedger spent={120} won={95} balance={99975} />);
    expect(html).toContain(`<dt>${t('casino.spent')}</dt>`);
    expect(html).toContain(`<dt>${t('casino.earned')}</dt>`);
    expect(html).toContain(`<dt>${t('casino.balance')}</dt>`);
    for (const value of ['120', '95', '99975']) expect(html).toContain(value);
  });
});
