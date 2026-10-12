import type { Meta, StoryObj } from '@storybook/react-vite';
import { WinnerBadge } from './WinnerBadge';

const meta = { title: 'Casino/WinnerBadge', component: WinnerBadge, args: { side: 'player', winner: 'player' } } satisfies Meta<typeof WinnerBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PlayerWins: Story = {};
export const DealerWins: Story = { args: { side: 'dealer', winner: 'dealer' } };
export const Push: Story = { args: { winner: 'push' } };
