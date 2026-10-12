import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toast } from './Toast';

const meta = { title: 'System/Toast', component: Toast, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tutorial: Story = { parameters: { stores: { toast: { toast: 'tutorial.done' } } } };
