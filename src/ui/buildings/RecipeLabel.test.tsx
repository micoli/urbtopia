import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { producibleItems, recipeOf, type MaterialId } from '../../core';
import { RecipeLabel } from './RecipeLabel';

const item = producibleItems('factory')[0]!;
const [material, amount] = Object.entries(recipeOf(item))[0] as [MaterialId, number];

describe('RecipeLabel', () => {
  it('shows only the needed amount by default', () => {
    const html = renderToStaticMarkup(<RecipeLabel item={item} materials={{ [material]: 7 }} />);
    expect(html).toContain(`${amount} `);
    expect(html).not.toContain('stock-count');
  });

  it('shows the stock beside the needed amount when asked', () => {
    const html = renderToStaticMarkup(<RecipeLabel item={item} materials={{ [material]: 7 }} showStock />);
    expect(html).toContain(`<span class="stock-count">7</span>/${amount}`);
  });

  it('shows an empty stock as zero', () => {
    const html = renderToStaticMarkup(<RecipeLabel item={item} materials={{}} showStock />);
    expect(html).toContain(`<span class="stock-count">0</span>/${amount}`);
  });
});
