import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChallengesPage } from './ChallengesPage';

const meta = { title: 'Codex/ChallengesPage', component: ChallengesPage } satisfies Meta<typeof ChallengesPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
