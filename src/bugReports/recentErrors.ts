import { ERROR_MAX_LENGTH, RECENT_ERRORS_KEPT } from './limits';

const recent: string[] = [];

export function recordError(message: string): void {
  recent.push(message.slice(0, ERROR_MAX_LENGTH));
  if (recent.length > RECENT_ERRORS_KEPT) recent.shift();
}

export function recentErrors(): string[] {
  return [...recent];
}

export function clearRecentErrors(): void {
  recent.length = 0;
}

export function describeError(value: unknown): string {
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

export function installErrorRecorder(target: Pick<Window, 'addEventListener'> = window, sink: Pick<Console, 'error'> = console): () => void {
  const abort = new AbortController();
  target.addEventListener('error', (event) => recordError(describeError((event as ErrorEvent).error ?? (event as ErrorEvent).message)), { signal: abort.signal });
  target.addEventListener('unhandledrejection', (event) => recordError(describeError((event as PromiseRejectionEvent).reason)), { signal: abort.signal });
  const original = sink.error;
  sink.error = (...args: unknown[]) => {
    recordError(args.map(describeError).join(' '));
    original.apply(sink, args);
  };
  return () => {
    abort.abort();
    sink.error = original;
  };
}
