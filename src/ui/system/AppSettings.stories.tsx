import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppSettings } from './AppSettings';

const meta = { title: 'System/AppSettings', component: AppSettings } satisfies Meta<typeof AppSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
