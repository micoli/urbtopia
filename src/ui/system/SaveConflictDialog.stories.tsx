import type { Meta, StoryObj } from '@storybook/react-vite';
import { SaveConflictDialog } from './SaveConflictDialog';

const meta = {
  title: 'System/SaveConflictDialog',
  component: SaveConflictDialog,
  parameters: { layout: 'fullscreen' },
  args: { conflict: { local: { savedAt: 1790000000000, citizens: 1240 }, cloud: { savedAt: 1790000000000 - 86_400_000, citizens: 980, revision: 14 } }, onChoose: () => {} },
} satisfies Meta<typeof SaveConflictDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
