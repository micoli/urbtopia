import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChallengeSuccess } from './ChallengeSuccess';

const meta = {
  title: 'Market/ChallengeSuccess',
  component: ChallengeSuccess,
  parameters: { layout: 'fullscreen' },
  args: { success: { id: 'daily-success', urbs: 1200, rewardKind: 'urbs' }, onDismiss: () => {} },
} satisfies Meta<typeof ChallengeSuccess>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Urbs: Story = {};
export const Medal: Story = { args: { success: { id: 'event-success', urbs: 0, rewardKind: 'medal' } } };
