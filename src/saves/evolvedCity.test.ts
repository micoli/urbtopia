import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { totalCitizens } from '../core';
import { parseEnvelope, serializeEnvelope } from '../persistence/envelope';
import { EVOLVED_CITY_NOW, buildEvolvedCity } from './evolvedCity';

const SAVE_PATH = 'saves/evolved-city.json';
const expectedText = () => JSON.stringify(JSON.parse(serializeEnvelope(buildEvolvedCity(), EVOLVED_CITY_NOW)), null, 2) + '\n';

if (process.env.UPDATE_SAVES) writeFileSync(SAVE_PATH, expectedText());

describe('evolved city save', () => {
  it('is up to date with its generator (run `npm run saves:update` after a change)', () => {
    expect(readFileSync(SAVE_PATH, 'utf8')).toBe(expectedText());
  });

  it('loads in the current app version', () => {
    const result = parseEnvelope(readFileSync(SAVE_PATH, 'utf8'));
    expect(result.ok).toBe(true);
    if (result.ok) expect(totalCitizens(result.state)).toBeGreaterThanOrEqual(1000);
  });
});
