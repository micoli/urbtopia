import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { VenueFixtureItem } from './VenueFixtureItem';

const item = (limit?: { count: number; max: number }) => renderToStaticMarkup(<VenueFixtureItem id="bakeryOven" tier={5} rank={1} selected={false} onChoose={() => {}} limit={limit} />);

describe('VenueFixtureItem', () => {
  it('shows how many of a limited Fixture are placed out of how many the building allows', () => {
    expect(item({ count: 2, max: 4 })).toContain('2/4');
    expect(item()).not.toMatch(/\d\/\d/);
  });

  it('is disabled once the limit is reached', () => {
    expect(item({ count: 4, max: 4 })).toMatch(/disabled/);
    expect(item({ count: 3, max: 4 })).not.toMatch(/disabled/);
  });
});
