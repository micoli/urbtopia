import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createBuilding, type FixtureId, type VenueFixture } from '../../core';
import { FarmFixtureStatus } from './FarmFixtureStatus';

const farm = { ...createBuilding(1, 'farm', 0, 0, 0), tier: 3 };
const fixture = (type: FixtureId, extra: Partial<VenueFixture> = {}): VenueFixture => ({ id: 1, type, x: 0, y: 0, rotation: 0, ...extra });
const render = (piece: VenueFixture, reached = true) => renderToStaticMarkup(<FarmFixtureStatus farm={farm} fixture={piece} reached={reached} />);

describe('the status of a Farm interior Fixture', () => {
  it('warns that a Harvest bin with no farmhand adds nothing', () => {
    expect(render(fixture('farmHarvestBin'))).toContain('note--warn');
  });

  it('shows the yield a Harvest bin adds, and asks for a Crop while none is picked', () => {
    const html = render(fixture('farmHarvestBin', { assigned: true }));
    expect(html).toContain('+5 %');
    expect(html).not.toContain('note--warn');
    expect(html).toContain('Pick a Crop');
  });

  it('shows the Crop that the farmhand harvests and how many Fields an hour', () => {
    const html = render(fixture('farmHarvestBin', { assigned: true, recipe: 'wheat' as unknown as VenueFixture['recipe'] }));
    expect(html).toContain('5 Fields an hour');
  });

  it('shows the Field bonus of a Sprinkler once its irrigator is assigned, and warns before', () => {
    expect(render(fixture('farmSprinkler'))).toContain('note--warn');
    expect(render(fixture('farmSprinkler', { assigned: true }))).toContain('+10 %');
  });

  it('shows no yield for a bin that no Line reaches', () => {
    expect(render(fixture('farmHarvestBin', { assigned: true }), false)).not.toContain('+5 %');
  });
});
