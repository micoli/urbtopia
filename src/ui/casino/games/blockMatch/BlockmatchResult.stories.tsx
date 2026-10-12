import type { Meta, StoryObj } from '@storybook/react-vite';
import { BlockmatchResult } from './BlockmatchResult';

const meta = { title: 'Casino/BlockmatchResult', component: BlockmatchResult, args: { stars: 3, net: 120 } } satisfies Meta<typeof BlockmatchResult>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeStars: Story = {};
export const OneStar: Story = { args: { stars: 1, net: -20 } };
export const Lost: Story = { args: { stars: 0, net: -100 } };
