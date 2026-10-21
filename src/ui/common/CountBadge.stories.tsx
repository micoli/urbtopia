import type { Meta, StoryObj } from '@storybook/react-vite';
import { CountBadge } from './CountBadge';

const meta = {
  title: 'Common/CountBadge',
  component: CountBadge,
  args: { count: 3, label: 'Unread' },
} satisfies Meta<typeof CountBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Capped: Story = { args: { count: 12 } };
export const Floating: Story = {
  args: { floating: true },
  decorators: [(Story) => <div style={{ position: 'relative', width: 48, height: 48 }}><Story /></div>],
};
