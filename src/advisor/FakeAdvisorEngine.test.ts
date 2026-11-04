import { describe, expect, it } from 'vitest';
import { AdvisorError } from './AdvisorEngine';
import { FakeAdvisorEngine } from './FakeAdvisorEngine';

async function collect(stream: AsyncIterable<string>): Promise<string[]> {
  const chunks: string[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  return chunks;
}

describe('FakeAdvisorEngine', () => {
  it('reports progress up to 1 then streams the chunks in order', async () => {
    const engine = new FakeAdvisorEngine({ chunks: ['a', 'b', 'c'] });
    const progress: number[] = [];
    await engine.load((fraction) => progress.push(fraction));
    expect(progress.at(-1)).toBe(1);
    expect(await collect(engine.ask([{ role: 'user', content: 'hi' }], new AbortController().signal))).toEqual(['a', 'b', 'c']);
    expect(engine.requests).toHaveLength(1);
  });

  it('stops streaming when aborted', async () => {
    const engine = new FakeAdvisorEngine({ chunks: ['a', 'b'] });
    const controller = new AbortController();
    controller.abort();
    expect(await collect(engine.ask([], controller.signal))).toEqual([]);
  });

  it.each(['unsupported', 'out-of-memory', 'network'] as const)('fails to load with %s', async (kind) => {
    const engine = new FakeAdvisorEngine({ loadFailure: kind });
    await expect(engine.load(() => undefined)).rejects.toMatchObject({ kind });
  });

  it('fails to answer with a typed error', async () => {
    const engine = new FakeAdvisorEngine({ askFailure: 'unknown' });
    await expect(collect(engine.ask([], new AbortController().signal))).rejects.toBeInstanceOf(AdvisorError);
  });

  it('can report that WebGPU is missing and forget the model', async () => {
    const engine = new FakeAdvisorEngine({ supported: false });
    expect(engine.isSupported()).toBe(false);
    await engine.deleteModel();
    expect(engine.deleted).toBe(true);
  });
});
