import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DrawerPanelLabelValue } from './DrawerPanelLabelValue';

describe('DrawerPanelLabelValue', () => {
  it('accepts paragraphs as children without nesting a paragraph in a paragraph', () => {
    const html = renderToStaticMarkup(
      <DrawerPanelLabelValue label="Solar" value="1.7 / h"><p>Demand: 1.0</p></DrawerPanelLabelValue>,
    );
    expect(html).not.toMatch(/<p[^>]*>(?:(?!<\/p>)[\s\S])*<p[ >]/);
    expect(html).toContain('<p>Demand: 1.0</p>');
  });

  it('separates the value from the text that follows it', () => {
    const html = renderToStaticMarkup(<DrawerPanelLabelValue label="Green" value={0}>Nearby vegetation</DrawerPanelLabelValue>);
    expect(html).toContain('0 Nearby vegetation');
  });
});
