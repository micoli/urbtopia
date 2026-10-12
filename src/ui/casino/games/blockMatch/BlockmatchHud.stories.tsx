import type { Meta, StoryObj } from '@storybook/react-vite';
import { BlockmatchHud } from './BlockmatchHud';

const meta = {
  title: 'Casino/BlockmatchHud',
  component: BlockmatchHud,
  args: { movesLeft: 12, goals: [{ type: 'color', color: 1, target: 10, remaining: 6 }, { type: 'box', target: 4, remaining: 4 }, { type: 'ice', target: 3, remaining: 0 }] },
} satisfies Meta<typeof BlockmatchHud>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const LastMove: Story = { args: { movesLeft: 1 } };
