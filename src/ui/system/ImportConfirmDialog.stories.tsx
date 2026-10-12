import type { Meta, StoryObj } from '@storybook/react-vite';
import { dialogStore } from '../../store/dialogStore';
import { gameStore } from '../../store/gameStore';
import { ImportConfirmDialog } from './ImportConfirmDialog';

const meta = { title: 'System/ImportConfirmDialog', component: ImportConfirmDialog, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof ImportConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pending: Story = { parameters: { stores: { setup: () => dialogStore.getState().setPendingImport(gameStore.getState().state) } } };
