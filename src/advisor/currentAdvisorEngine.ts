import { AdvisorError, type AdvisorEngine, type AdvisorMessage } from './AdvisorEngine';
import { fakeAdvisorOptions } from './advisorFakeFlag';
import { FakeAdvisorEngine } from './FakeAdvisorEngine';
import { hasWebGpu } from './hasWebGpu';

// The WebLLM library is a separate chunk, fetched only once the Player turns the Advisor on.
class LazyWebLlmEngine implements AdvisorEngine {
  private real: Promise<AdvisorEngine> | null = null;

  private engine(): Promise<AdvisorEngine> {
    this.real ??= import('./WebLlmAdvisorEngine').then(module => new module.WebLlmAdvisorEngine());
    return this.real;
  }

  isSupported(): boolean {
    return hasWebGpu();
  }

  async load(onProgress: (fraction: number) => void): Promise<void> {
    if (!hasWebGpu()) throw new AdvisorError('unsupported');
    await (await this.engine()).load(onProgress);
  }

  async *ask(messages: readonly AdvisorMessage[], signal: AbortSignal): AsyncIterable<string> {
    yield* (await this.engine()).ask(messages, signal);
  }

  async unload(): Promise<void> {
    await (await this.engine()).unload();
  }

  async deleteModel(): Promise<void> {
    await (await this.engine()).deleteModel();
  }
}

let current: AdvisorEngine | null = null;

export function advisorEngine(): AdvisorEngine {
  if (current) return current;
  const fake = typeof window === 'undefined' ? null : fakeAdvisorOptions(window.location.search);
  current = fake ? new FakeAdvisorEngine(fake) : new LazyWebLlmEngine();
  return current;
}

export function setAdvisorEngine(engine: AdvisorEngine | null): void {
  current = engine;
}
