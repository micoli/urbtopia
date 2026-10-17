import type { Meta, StoryObj } from '@storybook/react-vite';
import { BlockedReason } from './BlockedReason';

const meta = { title: 'Common/BlockedReason', component: BlockedReason, args: { reason: 'Not enough Urbs: 200 needed.' } } satisfies Meta<typeof BlockedReason>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NoReason: Story = { args: { reason: null } };
