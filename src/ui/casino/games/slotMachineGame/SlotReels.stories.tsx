import type { Meta, StoryObj } from '@storybook/react-vite';
import { SlotReels } from './SlotReels';

const meta = { title: 'Casino/SlotReels', component: SlotReels, args: { reels: ['cherry', 'lemon', 'bell'], spinning: false } } satisfies Meta<typeof SlotReels>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Stopped: Story = {};
export const Jackpot: Story = { args: { reels: ['seven', 'seven', 'seven'] } };
export const Spinning: Story = { args: { spinning: true } };
export const Idle: Story = { args: { reels: null } };
