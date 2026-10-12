import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatChip } from './StatChip';

const meta = {
  title: 'Common/StatChip',
  component: StatChip,
  args: { icon: '⚡', value: 42, title: 'Power' },
  argTypes: { tone: { control: 'inline-radio', options: ['normal', 'warning', 'critical'] } },
} satisfies Meta<typeof StatChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Normal: Story = { args: { tone: 'normal' } };
export const Warning: Story = { args: { tone: 'warning' } };
export const Critical: Story = { args: { tone: 'critical' } };
export const Labelled: Story = { args: { labelled: true } };
