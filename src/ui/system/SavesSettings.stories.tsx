import type { Meta, StoryObj } from '@storybook/react-vite';
import { SavesSettings } from './SavesSettings';

const meta = { title: 'System/SavesSettings', component: SavesSettings } satisfies Meta<typeof SavesSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
