import type { Meta, StoryObj } from '@storybook/react-vite';
import { SettingsContent } from './SettingsContent';

const meta = { title: 'System/SettingsContent', component: SettingsContent } satisfies Meta<typeof SettingsContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Evolved: Story = { parameters: { game: 'evolved' } };
