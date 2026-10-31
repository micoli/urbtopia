import type { Meta, StoryObj } from '@storybook/react-vite';
import { DisplaySettings } from './DisplaySettings';

const meta = { title: 'System/DisplaySettings', component: DisplaySettings } satisfies Meta<typeof DisplaySettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
