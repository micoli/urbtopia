import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { t } from '../../i18n/t';
import { CasinoLedger } from './CasinoLedger';

describe('casino ledger', () => {
  it('shows what was spent, what was won and the net result since the window opened', () => {
    const html = renderToStaticMarkup(<CasinoLedger spent={120} won={95} />);
    expect(html).toContain(`<dt>${t('casino.spent')}</dt>`);
    expect(html).toContain(`<dt>${t('casino.earned')}</dt>`);
    expect(html).toContain(`<dt>${t('casino.balance')}</dt>`);
    expect(html).toContain('data-sign="-1"');
    expect(html).toContain('-25');
  });

  it('signs a gain with a plus and a draw with nothing', () => {
    expect(renderToStaticMarkup(<CasinoLedger spent={10} won={35} />)).toMatch(/data-sign="1"[^>]*>.*\+<span class="urbs-amount">25/);
    expect(renderToStaticMarkup(<CasinoLedger spent={10} won={10} />)).toContain('data-sign="0"');
  });
});
