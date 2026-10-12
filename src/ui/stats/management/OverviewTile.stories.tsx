import type { Meta, StoryObj } from '@storybook/react-vite';
import { OverviewTile } from './OverviewTile';

const meta = { title: 'Stats/OverviewTile', component: OverviewTile, args: { icon: '⚡', title: 'Power', children: 'Power balance: +12' } } satisfies Meta<typeof OverviewTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Warning: Story = { args: { warning: true, children: 'Power balance: -30' } };
