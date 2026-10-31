import type { Meta, StoryObj } from '@storybook/react-vite';
import { ActionButton } from '../common/ActionButton';
import { SettingRow } from './SettingRow';

const meta = { title: 'System/SettingRow', component: SettingRow, args: { label: 'Export the city', description: 'Downloads this city as a file.', children: <ActionButton size="sm">Export</ActionButton> } } satisfies Meta<typeof SettingRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Stacked: Story = { args: { stacked: true } };
