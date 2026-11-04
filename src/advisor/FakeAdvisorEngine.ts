import { AdvisorError, type AdvisorEngine, type AdvisorErrorKind, type AdvisorMessage } from './AdvisorEngine';

export interface FakeAdvisorOptions {
  supported?: boolean;
  chunks?: readonly string[];
  loadFailure?: AdvisorErrorKind;
  askFailure?: AdvisorErrorKind;
}

const DEFAULT_CHUNKS = ['Fake ', 'advisor ', 'answer.'];

export class FakeAdvisorEngine implements AdvisorEngine {
  readonly requests: AdvisorMessage[][] = [];
  deleted = false;
  loaded = false;

  constructor(private readonly options: FakeAdvisorOptions = {}) {}

  isSupported(): boolean {
    return this.options.supported ?? true;
  }

  async load(onProgress: (fraction: number) => void): Promise<void> {
    if (this.options.loadFailure) throw new AdvisorError(this.options.loadFailure);
    onProgress(0.5);
    onProgress(1);
    this.loaded = true;
    this.deleted = false;
  }

  async *ask(messages: readonly AdvisorMessage[], signal: AbortSignal): AsyncIterable<string> {
    this.requests.push([...messages]);
    if (this.options.askFailure) throw new AdvisorError(this.options.askFailure);
    for (const chunk of this.options.chunks ?? DEFAULT_CHUNKS) {
      if (signal.aborted) return;
      yield chunk;
    }
  }

  async unload(): Promise<void> {
    this.loaded = false;
  }

  async deleteModel(): Promise<void> {
    this.loaded = false;
    this.deleted = true;
  }
}
