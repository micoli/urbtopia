import { CreateWebWorkerMLCEngine, deleteModelAllInfoInCache, type WebWorkerMLCEngine } from '@mlc-ai/web-llm';
import { AdvisorError, type AdvisorEngine, type AdvisorMessage } from './AdvisorEngine';
import { ADVISOR_MODEL } from './advisorModel';
import { classifyAdvisorFailure } from './classifyAdvisorFailure';
import { hasWebGpu } from './hasWebGpu';

const ANSWER = { temperature: 0.4, maxTokens: 300 };

export class WebLlmAdvisorEngine implements AdvisorEngine {
  private engine: WebWorkerMLCEngine | null = null;
  private worker: Worker | null = null;

  isSupported(): boolean {
    return hasWebGpu();
  }

  async load(onProgress: (fraction: number) => void): Promise<void> {
    if (this.engine) return;
    if (!hasWebGpu()) throw new AdvisorError('unsupported');
    try {
      this.worker = new Worker(new URL('./webLlm.worker.ts', import.meta.url), { type: 'module' });
      this.engine = await CreateWebWorkerMLCEngine(this.worker, ADVISOR_MODEL.id, {
        initProgressCallback: (report) => onProgress(report.progress),
      });
    } catch (failure) {
      await this.unload();
      throw classifyAdvisorFailure(failure);
    }
  }

  async *ask(messages: readonly AdvisorMessage[], signal: AbortSignal): AsyncIterable<string> {
    const engine = this.engine;
    if (!engine) throw new AdvisorError('unknown', 'Advisor model not loaded');
    try {
      const stream = await engine.chat.completions.create({
        messages: [...messages],
        stream: true,
        temperature: ANSWER.temperature,
        max_tokens: ANSWER.maxTokens,
      });
      for await (const chunk of stream) {
        if (signal.aborted) {
          await engine.interruptGenerate();
          return;
        }
        const text = chunk.choices[0]?.delta.content;
        if (text) yield text;
      }
    } catch (failure) {
      throw classifyAdvisorFailure(failure);
    }
  }

  async unload(): Promise<void> {
    this.worker?.terminate();
    this.worker = null;
    this.engine = null;
  }

  async deleteModel(): Promise<void> {
    await this.unload();
    try {
      await deleteModelAllInfoInCache(ADVISOR_MODEL.id);
    } catch (failure) {
      throw classifyAdvisorFailure(failure);
    }
  }
}
