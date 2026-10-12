import type { Meta, StoryObj } from '@storybook/react-vite';
import { BlockmatchStars } from './BlockmatchStars';

const meta = { title: 'Casino/BlockmatchStars', component: BlockmatchStars, args: { count: 2 } } satisfies Meta<typeof BlockmatchStars>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Two: Story = {};
export const None: Story = { args: { count: 0 } };
export const Three: Story = { args: { count: 3 } };
