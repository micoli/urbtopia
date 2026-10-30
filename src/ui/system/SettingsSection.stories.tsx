import type { Meta, StoryObj } from '@storybook/react-vite';
import { SettingRow } from './SettingRow';
import { SettingsSection } from './SettingsSection';

const meta = { title: 'System/SettingsSection', component: SettingsSection, args: { title: 'City', icon: 'map', children: <SettingRow label="Seed" description="The code this city was generated from."><code>amber-fox-4821</code></SettingRow> } } satisfies Meta<typeof SettingsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
