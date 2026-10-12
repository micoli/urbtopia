import type { Meta, StoryObj } from '@storybook/react-vite';
import { NavBadge } from './NavBadge';

const meta = { title: 'Layout/NavBadge', component: NavBadge, args: { count: 3 } } satisfies Meta<typeof NavBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Overflow: Story = { args: { count: 12 } };
