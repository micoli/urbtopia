import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { NavBadge } from './NavBadge';

describe('NavBadge', () => {
  it('shows nothing without pending requests', () => {
    expect(renderToStaticMarkup(<NavBadge />)).toBe('');
    expect(renderToStaticMarkup(<NavBadge count={0} />)).toBe('');
  });

  it('shows the count, capped at 9+', () => {
    expect(renderToStaticMarkup(<NavBadge count={3} />)).toContain('>3<');
    expect(renderToStaticMarkup(<NavBadge count={12} />)).toContain('>9+<');
  });

  it('names what it counts, social requests by default', () => {
    expect(renderToStaticMarkup(<NavBadge count={2} />)).toContain('aria-label="Social: 2"');
    expect(renderToStaticMarkup(<NavBadge count={2} label="Sanctioned Homes" />)).toContain('aria-label="Sanctioned Homes: 2"');
  });
});
