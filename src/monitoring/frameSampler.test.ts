import { describe, expect, it, vi } from 'vitest';
import { FrameSampler } from './frameSampler';

function run(sampler: FrameSampler, from: number, to: number, step: number) {
  for (let now = from; now <= to; now += step) sampler.onFrame(now);
}

describe('FrameSampler', () => {
  it('reports the frame rate and the worst frame once per ten seconds', () => {
    const report = vi.fn();
    const sampler = new FrameSampler(() => ({ device: 'desktop' }), report);
    run(sampler, 0, 10_000, 20);
    expect(report).toHaveBeenCalledWith('fps', expect.closeTo(50, 0), 'none', { device: 'desktop' });
    expect(report).toHaveBeenCalledWith('frame_ms_worst', 20, 'millisecond', { device: 'desktop' });
  });

  it('drops the window when the page was hidden', () => {
    const report = vi.fn();
    const sampler = new FrameSampler(() => ({}), report);
    run(sampler, 0, 5000, 20);
    sampler.onFrame(60_000);
    run(sampler, 60_020, 65_000, 20);
    expect(report).not.toHaveBeenCalled();
  });
});
