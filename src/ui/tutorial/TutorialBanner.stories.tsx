import type { Meta, StoryObj } from '@storybook/react-vite';
import { TutorialBanner } from './TutorialBanner';

const meta = { title: 'Tutorial/TutorialBanner', component: TutorialBanner, parameters: { layout: 'fullscreen', game: 'tutorial' } } satisfies Meta<typeof TutorialBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
