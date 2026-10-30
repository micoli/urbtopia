import type { Meta, StoryObj } from '@storybook/react-vite';
import { GameSettings } from './GameSettings';

const meta = { title: 'System/GameSettings', component: GameSettings } satisfies Meta<typeof GameSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
