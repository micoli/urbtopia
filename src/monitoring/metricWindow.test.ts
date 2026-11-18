import { describe, expect, it, vi } from 'vitest';
import { MetricWindow } from './metricWindow';

describe('MetricWindow', () => {
  it('reports the average and the maximum, then starts again', () => {
    const report = vi.fn();
    const window = new MetricWindow('tick_ms', 'millisecond', report);
    window.add(2);
    window.add(6);
    window.flush({ city_size: 'small' });
    expect(report).toHaveBeenCalledWith('tick_ms_avg', 4, 'millisecond', { city_size: 'small' });
    expect(report).toHaveBeenCalledWith('tick_ms_max', 6, 'millisecond', { city_size: 'small' });
    report.mockClear();
    window.flush({});
    expect(report).not.toHaveBeenCalled();
  });
});
