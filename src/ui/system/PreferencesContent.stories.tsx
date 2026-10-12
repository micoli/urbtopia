import type { Meta, StoryObj } from '@storybook/react-vite';
import { PreferencesContent } from './PreferencesContent';

const meta = { title: 'System/PreferencesContent', component: PreferencesContent } satisfies Meta<typeof PreferencesContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
