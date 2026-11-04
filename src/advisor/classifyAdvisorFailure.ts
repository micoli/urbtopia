import { AdvisorError } from './AdvisorEngine';

export function classifyAdvisorFailure(failure: unknown): AdvisorError {
  if (failure instanceof AdvisorError) return failure;
  const message = failure instanceof Error ? failure.message : String(failure);
  if (/webgpu|navigator\.gpu/i.test(message)) return new AdvisorError('unsupported', message);
  if (/out of memory|memory|device was lost|OOM|maxBufferSize/i.test(message)) return new AdvisorError('out-of-memory', message);
  if (/network|fetch|failed to load|NetworkError|cache/i.test(message)) return new AdvisorError('network', message);
  return new AdvisorError('unknown', message);
}
