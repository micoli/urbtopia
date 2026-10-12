import type { Meta, StoryObj } from '@storybook/react-vite';
import { SettingsPanel } from './SettingsPanel';

const meta = { title: 'System/SettingsPanel', component: SettingsPanel, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof SettingsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = { parameters: { stores: { ui: { settingsOpen: true } } } };
