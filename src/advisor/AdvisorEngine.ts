export type AdvisorErrorKind = 'unsupported' | 'out-of-memory' | 'network' | 'unknown';

export class AdvisorError extends Error {
  constructor(readonly kind: AdvisorErrorKind, message?: string) {
    super(message ?? kind);
    this.name = 'AdvisorError';
  }
}

export interface AdvisorMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AdvisorEngine {
  isSupported(): boolean;
  load(onProgress: (fraction: number) => void): Promise<void>;
  ask(messages: readonly AdvisorMessage[], signal: AbortSignal): AsyncIterable<string>;
  unload(): Promise<void>;
  deleteModel(): Promise<void>;
}
