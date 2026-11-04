import { describe, expect, it } from 'vitest';
import { fakeAdvisorOptions } from './advisorFakeFlag';

describe('fakeAdvisorOptions', () => {
  it('is off without the parameter', () => {
    expect(fakeAdvisorOptions('?e2e')).toBeNull();
  });

  it('scripts success, failure and missing WebGPU', () => {
    expect(fakeAdvisorOptions('?advisor-fake')).toEqual({});
    expect(fakeAdvisorOptions('?advisor-fake=fail')).toEqual({ loadFailure: 'out-of-memory' });
    expect(fakeAdvisorOptions('?advisor-fake=unsupported')).toEqual({ supported: false });
  });
});
