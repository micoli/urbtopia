import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChallengeGoalLine } from './ChallengeGoalLine';

const meta = { title: 'Market/ChallengeGoalLine', component: ChallengeGoalLine, decorators: [(Story) => <ul style={{ listStyle: 'none', padding: 0 }}><Story /></ul>], args: { item: 'planks', quantity: 8 } } satisfies Meta<typeof ChallengeGoalLine>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Goal: Story = {};
export const SettingAside: Story = { args: { setAside: 3, available: 12, onSetAside: () => {} } };
export const Nothing: Story = { args: { setAside: 3, available: 0, onSetAside: () => {} } };
