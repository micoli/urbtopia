import type { Meta, StoryObj } from '@storybook/react-vite';
import type { QueueEntry } from '../../core';
import { WorkWheel } from './WorkWheel.tsx';

const NOW = 1_000_000;
const entry = (overrides: Partial<QueueEntry>): QueueEntry => ({ item: 'planks', duration: 60_000, startedAt: null, done: false, quantity: 1, ...overrides });

const meta = {
  title: 'Common/WorkWheel',
  component: WorkWheel,
  args: { now: NOW, queue: [entry({ startedAt: NOW - 30_000 })] },
  decorators: [(Story) => <div style={{ width: 96, height: 96 }}><Story /></div>],
} satisfies Meta<typeof WorkWheel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleJob: Story = {};

export const MixedQueue: Story = {
  args: { queue: [entry({ done: true }), entry({ startedAt: NOW - 20_000 }), entry({}), entry({ duration: 120_000 })] },
};
