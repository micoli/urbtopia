import type { Meta, StoryObj } from '@storybook/react-vite';
import { SaveFailedDialog } from './SaveFailedDialog';

const meta = { title: 'System/SaveFailedDialog', component: SaveFailedDialog, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof SaveFailedDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = { parameters: { stores: { dialog: { saveFailed: true } } } };
