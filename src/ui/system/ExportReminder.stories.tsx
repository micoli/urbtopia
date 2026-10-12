import type { Meta, StoryObj } from '@storybook/react-vite';
import { ExportReminder } from './ExportReminder';

const meta = { title: 'System/ExportReminder', component: ExportReminder, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof ExportReminder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = { parameters: { stores: { dialog: { exportReminder: true } } } };
