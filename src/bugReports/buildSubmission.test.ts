import { describe, expect, it } from 'vitest';
import { buildSubmission, canSend, imageOf } from './buildSubmission';

const snapshot = { map: 'data:map', screen: 'data:screen', pose: { x: 1, z: 2, zoom: 3, yaw: 0, level: 0 as const }, cityId: 'c1', citySeed: 'amber' };
const city = { kind: 'json' as const, value: { a: 1 } };

describe('buildSubmission', () => {
  it('sends the chosen image, the City and the pose', () => {
    const submission = buildSubmission({ description: '  broken  ', image: 'screen', attachCity: true }, snapshot, city, { v: 1 });
    expect(submission).toMatchObject({ description: 'broken', screenshot: 'data:screen', city, camera: snapshot.pose, cityId: 'c1', citySeed: 'amber', context: { v: 1 } });
  });

  it('leaves out the image and the City when the player unchecks them', () => {
    const submission = buildSubmission({ description: 'x', image: 'none', attachCity: false }, snapshot, city, {});
    expect(submission.screenshot).toBeNull();
    expect(submission.city).toBeNull();
  });

  it('picks the map image', () => {
    expect(imageOf(snapshot, 'map')).toBe('data:map');
  });

  it('accepts a description from 1 to 4000 characters once trimmed', () => {
    expect(canSend('   ')).toBe(false);
    expect(canSend('a')).toBe(true);
    expect(canSend('a'.repeat(4001))).toBe(false);
  });
});
