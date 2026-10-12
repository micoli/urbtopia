import type { Meta, StoryObj } from '@storybook/react-vite';
import { SanctionsDifficultyTable } from './SanctionsDifficultyTable';

const meta = { title: 'Codex/SanctionsDifficultyTable', component: SanctionsDifficultyTable, args: { current: 'medium' } } satisfies Meta<typeof SanctionsDifficultyTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Medium: Story = {};
export const Cozy: Story = { args: { current: 'cozy' } };
export const Hard: Story = { args: { current: 'hard' } };
