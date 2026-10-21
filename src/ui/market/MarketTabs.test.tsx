import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MarketTabs } from './MarketTabs';

const render = (eventsPending: number) => renderToStaticMarkup(<MarketTabs tab="market" eventsPending={eventsPending} onSelect={() => {}} />);

describe('MarketTabs', () => {
  it('shows no badge without a new Challenge', () => {
    expect(render(0)).not.toContain('count-badge');
  });

  it('shows the number of new Challenges on the Events tab, up to 9+', () => {
    expect(render(3)).toContain('>3<');
    expect(render(12)).toContain('>9+<');
  });
});
