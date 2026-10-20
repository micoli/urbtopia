import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CouncilCircle } from './CouncilCircle';

const seats = { economy: 3, environment: 3, services: 3 };

describe('CouncilCircle', () => {
  it('draws one seat per member, and describes the Council to a screen reader', () => {
    const html = renderToStaticMarkup(<CouncilCircle seats={seats} />);
    expect(html.match(/council-seat/g)).toHaveLength(9);
    expect(html).toContain('role="img"');
    expect(html).toContain('Council of 9 seats: Economy 3, Environment 3, Services 3');
  });

  it('gives each Faction its own shape, not only its colour', () => {
    const html = renderToStaticMarkup(<CouncilCircle seats={seats} />);
    expect(html.match(/<circle[^>]*data-faction="economy"/g)).toHaveLength(3);
    expect(html.match(/<rect[^>]*data-faction="environment"/g)).toHaveLength(3);
    expect(html.match(/<polygon[^>]*data-faction="services"/g)).toHaveLength(3);
  });

  it('seats the Factions in turn, around the circle', () => {
    const html = renderToStaticMarkup(<CouncilCircle seats={seats} />);
    const factions = [...html.matchAll(/data-faction="(\w+)"/g)].map(match => match[1]);
    expect(factions.slice(0, 6)).toEqual(['economy', 'environment', 'services', 'economy', 'environment', 'services']);
  });

  it('draws the seats that vote against as hollow ones', () => {
    const votes = [{ faction: 'economy', seats: 3, vote: 'for' }, { faction: 'environment', seats: 3, vote: 'against' }, { faction: 'services', seats: 3, vote: 'against' }] as const;
    const html = renderToStaticMarkup(<CouncilCircle seats={seats} votes={votes} />);
    expect(html.match(/data-vote="against"/g)).toHaveLength(6);
    expect(html.match(/data-vote="for"/g)).toHaveLength(3);
  });
});
