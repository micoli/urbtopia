import type { Meta, StoryObj } from '@storybook/react-vite';
import { LeaveRoundDialog } from './LeaveRoundDialog';

const meta = { title: 'Casino/LeaveRoundDialog', component: LeaveRoundDialog, parameters: { layout: 'fullscreen' }, args: { onStay: () => {}, onLeave: () => {} } } satisfies Meta<typeof LeaveRoundDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
