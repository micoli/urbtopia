import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { t } from '../../../../i18n/t.ts';
import { BlockmatchResult } from './BlockmatchResult.tsx';

describe('blockmatch result', () => {
  it('announces a win with its stars and the gain', () => {
    const html = renderToStaticMarkup(<BlockmatchResult stars={3} net={100} />);
    expect(html).toContain('data-win="true"');
    expect(html).toContain(t('casino.victory'));
    expect(html).toContain('+<span class="urbs-amount">100');
    expect((html.match(/star--on/g) ?? []).length).toBe(3);
  });

  it('announces a defeat with no star and the lost Stake', () => {
    const html = renderToStaticMarkup(<BlockmatchResult stars={0} net={-100} />);
    expect(html).toContain('data-win="false"');
    expect(html).toContain(t('casino.defeat'));
    expect(html).toContain('−<span class="urbs-amount">100');
    expect(html).not.toContain('star--on');
  });
});
