import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CurrencyText } from './CurrencyText';
import { UrbsAmount } from './UrbsAmount';

describe('CurrencyText', () => {
  it('replaces the currency token with the gold U', () => {
    const html = renderToStaticMarkup(<CurrencyText text="Not enough {U}." />);
    expect(html).toContain('Not enough ');
    expect(html).toContain('class="urbs-symbol"');
    expect(html).not.toContain('{U}');
    expect(html.endsWith('.')).toBe(true);
  });

  it('leaves a text without the token untouched', () => {
    expect(renderToStaticMarkup(<CurrencyText text="Nothing to collect." />)).toBe('Nothing to collect.');
  });
});

describe('UrbsAmount', () => {
  it('shows the amount followed by the gold U', () => {
    const html = renderToStaticMarkup(<UrbsAmount value={250} />);
    expect(html).toContain('250');
    expect(html).toContain('urbs-symbol');
  });
});
