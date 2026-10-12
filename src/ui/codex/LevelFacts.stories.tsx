import type { Meta, StoryObj } from '@storybook/react-vite';
import { LevelFacts } from './LevelFacts';

const meta = { title: 'Codex/LevelFacts', component: LevelFacts, args: { id: 'home', level: 1 } } satisfies Meta<typeof LevelFacts>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HomeLevelOne: Story = {};
export const HomeLevelFive: Story = { args: { level: 5 } };
export const Workshop: Story = { args: { id: 'workshop', level: 2 } };
