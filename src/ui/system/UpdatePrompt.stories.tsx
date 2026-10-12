import type { Meta, StoryObj } from '@storybook/react-vite';
import { UpdatePrompt } from './UpdatePrompt';

const meta = { title: 'System/UpdatePrompt', component: UpdatePrompt, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof UpdatePrompt>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = { parameters: { stores: { dialog: { updateReady: true } } } };
