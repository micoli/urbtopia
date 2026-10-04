import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { t } from '../../i18n/t.ts';
import { CasinoHeader } from './CasinoHeader.tsx';
import { CasinoCloseContext } from './casinoCloseContext.ts';

const header = <CasinoHeader spent={10} won={0} steps={[10, 50]} urbs={1000} stake={10} onStake={() => {}} />;

describe('casino header', () => {
  it('puts the close button on the ledger line, before the stake bar', () => {
    const html = renderToStaticMarkup(<CasinoCloseContext.Provider value={() => {}}>{header}</CasinoCloseContext.Provider>);
    const top = html.slice(html.indexOf('casino-header-top'), html.indexOf('stake-picker'));
    expect(top).toContain('casino-ledger');
    expect(top).toContain(`aria-label="${t('casino.close')}"`);
  });

  it('has no close button outside a casino window', () => {
    expect(renderToStaticMarkup(header)).not.toContain('panel-close');
  });
});
