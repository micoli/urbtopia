import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReplanConfirmDialog } from './ReplanConfirmDialog';

const meta = {
  title: 'System/Replan/ReplanConfirmDialog',
  component: ReplanConfirmDialog,
  parameters: { layout: 'fullscreen' },
  args: { title: 'Replan this city?', body: 'Everything you placed goes into the Stash and the game stands still.', confirmLabel: 'Replan', keepLabel: 'Keep replanning', onConfirm: () => {}, onClose: () => {} },
} satisfies Meta<typeof ReplanConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
