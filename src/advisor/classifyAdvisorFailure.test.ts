import { describe, expect, it } from 'vitest';
import { AdvisorError } from './AdvisorEngine';
import { classifyAdvisorFailure } from './classifyAdvisorFailure';

describe('classifyAdvisorFailure', () => {
  it.each([
    ['WebGPU is not supported', 'unsupported'],
    ['Device was lost during execution', 'out-of-memory'],
    ['Failed to fetch model', 'network'],
    ['something odd', 'unknown'],
  ])('maps "%s" to %s', (message, kind) => {
    expect(classifyAdvisorFailure(new Error(message)).kind).toBe(kind);
  });

  it('keeps an AdvisorError as it is', () => {
    const error = new AdvisorError('network');
    expect(classifyAdvisorFailure(error)).toBe(error);
  });
});
