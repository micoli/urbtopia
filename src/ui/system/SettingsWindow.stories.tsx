import type { Meta, StoryObj } from '@storybook/react-vite';
import { SettingsWindow } from './SettingsWindow';

const meta = { title: 'System/SettingsWindow', component: SettingsWindow, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof SettingsWindow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = { parameters: { stores: { ui: { settingsOpen: true } } } };
