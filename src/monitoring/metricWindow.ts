import * as Sentry from '@sentry/react';

export type MetricAttributes = Record<string, string>;
export type MetricReporter = (name: string, value: number, unit: string, attributes: MetricAttributes) => void;

export const sentryReporter: MetricReporter = (name, value, unit, attributes) => {
  Sentry.metrics.distribution(name, value, { unit, attributes });
};

// Collects values and reports their average and their maximum once, so a per-second measure does not become one Sentry data point per second.
export class MetricWindow {
  private sum = 0;
  private max = 0;
  private count = 0;

  constructor(
    private readonly name: string,
    private readonly unit: string,
    private readonly report: MetricReporter = sentryReporter,
  ) {}

  add(value: number): void {
    this.sum += value;
    this.max = Math.max(this.max, value);
    this.count += 1;
  }

  flush(attributes: MetricAttributes): void {
    if (this.count === 0) return;
    this.report(`${this.name}_avg`, this.sum / this.count, this.unit, attributes);
    this.report(`${this.name}_max`, this.max, this.unit, attributes);
    this.sum = 0;
    this.max = 0;
    this.count = 0;
  }
}
