import { describe, expect, it } from 'vitest';
import { isBypassTutorialRequested } from './bypassTutorialFlag';

describe('isBypassTutorialRequested', () => {
  it('is on when the bypass-tutorial parameter is present', () => {
    expect(isBypassTutorialRequested('?bypass-tutorial')).toBe(true);
    expect(isBypassTutorialRequested('?fps&bypass-tutorial=1')).toBe(true);
  });

  it('is on with the e2e parameter', () => {
    expect(isBypassTutorialRequested('?e2e')).toBe(true);
  });

  it('is off otherwise', () => {
    expect(isBypassTutorialRequested('')).toBe(false);
    expect(isBypassTutorialRequested('?fps')).toBe(false);
    expect(isBypassTutorialRequested('?tutorial')).toBe(false);
  });
});
