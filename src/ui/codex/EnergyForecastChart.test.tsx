import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { newGame } from '../../core';
import { EnergyForecastChart } from './EnergyForecastChart';

const count = (html: string, needle: string) => html.split(needle).length - 1;

describe('Energy forecast chart', () => {
  const state = newGame({ seed: 'forecast', now: 0 });

  it('draws the four sources over four hours by default', () => {
    const html = renderToStaticMarkup(<EnergyForecastChart state={state} />);
    expect(count(html, '<polyline')).toBe(4);
    expect(html).toContain('+4h');
    expect(html).not.toContain('+5h');
  });

  it('draws only the asked sources over the asked hours', () => {
    const html = renderToStaticMarkup(<EnergyForecastChart state={state} hours={6} sources={['solar', 'wind', 'hydro']} />);
    expect(count(html, '<polyline')).toBe(3);
    expect(html).toContain('+6h');
    expect(html).not.toContain('NaN');
  });
});
