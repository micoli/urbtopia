import type { Meta, StoryObj } from '@storybook/react-vite';
import { GameClock } from './GameClock';

const meta = { title: 'Stats/GameClock', component: GameClock } satisfies Meta<typeof GameClock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
