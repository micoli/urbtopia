import type { FakeAdvisorOptions } from './FakeAdvisorEngine';

// `?advisor-fake` swaps WebLLM for a scripted engine in tests and by-hand runs; `=fail` and `=unsupported` script the failures.
export function fakeAdvisorOptions(search: string): FakeAdvisorOptions | null {
  const params = new URLSearchParams(search);
  if (!params.has('advisor-fake')) return null;
  const mode = params.get('advisor-fake');
  if (mode === 'fail') return { loadFailure: 'out-of-memory' };
  if (mode === 'unsupported') return { supported: false };
  return {};
}
