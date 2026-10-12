import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConfirmSaleDialog } from './ConfirmSaleDialog';

const meta = { title: 'Build/ConfirmSaleDialog', component: ConfirmSaleDialog, parameters: { game: 'evolved' } } satisfies Meta<typeof ConfirmSaleDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pending: Story = { parameters: { stores: { ui: { pendingSaleId: 1 } } } };
