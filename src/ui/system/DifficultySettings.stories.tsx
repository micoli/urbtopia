import type { Meta, StoryObj } from '@storybook/react-vite';
import { DifficultySettings } from './DifficultySettings';

const meta = { title: 'System/DifficultySettings', component: DifficultySettings } satisfies Meta<typeof DifficultySettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
