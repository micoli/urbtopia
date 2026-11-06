import type { Meta, StoryObj } from '@storybook/react-vite';
import { SettingsTabs } from './SettingsTabs';

const meta = { title: 'System/SettingsTabs', component: SettingsTabs, args: { tab: 'game', visible: ['game', 'display', 'saves', 'app'], unreadReports: 0, onSelect: () => {} } } satisfies Meta<typeof SettingsTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Saves: Story = { args: { tab: 'saves' } };
export const WithReports: Story = { args: { tab: 'reports', visible: ['game', 'display', 'saves', 'app', 'reports'], unreadReports: 2 } };
