import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { createBuilding, jobsOf } from '../../core';
import { BuildingJobs } from './BuildingJobs';

const filled = vi.hoisted(() => ({ value: 0 }));
vi.mock('./useFilledJobs', () => ({ useFilledJobs: () => filled.value }));
vi.mock('../common/DrawerPanel', () => ({
  DrawerPanel: Object.assign(({ children }: { children?: React.ReactNode }) => <div>{children}</div>, {
    LabelValue: ({ value }: { value: React.ReactNode }) => <p>{value}</p>,
  }),
}));

const factory = createBuilding(900, 'factory', 56, 56, 2);
const render = (value: number) => {
  filled.value = value;
  return renderToStaticMarkup(<BuildingJobs building={factory} />);
};

describe('BuildingJobs decimals', () => {
  it('rounds the filled Jobs to one decimal at most', () => {
    expect(render(12.3456)).toContain(`12.3 / ${jobsOf(factory)}`);
    expect(render(7.96)).toContain(`8 / ${jobsOf(factory)}`);
  });

  it('shows a whole figure without decimal', () => {
    expect(render(10)).toContain(`10 / ${jobsOf(factory)}`);
  });
});
