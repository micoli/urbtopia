import type { Meta, StoryObj } from '@storybook/react-vite';
import { VenueBuildMenu } from './VenueBuildMenu';

const meta = {
  title: 'Venue/VenueBuildMenu',
  component: VenueBuildMenu,
  args: { tier: 3, rank: 3, venueType: 'arcade' },
  argTypes: { venueType: { control: 'inline-radio', options: ['arcade', 'hotel', 'supermarket'] } },
} satisfies Meta<typeof VenueBuildMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Arcade: Story = {};
export const Hotel: Story = { args: { venueType: 'hotel' } };
export const Supermarket: Story = { args: { venueType: 'supermarket' } };
export const LowTier: Story = { args: { tier: 1, rank: 1 } };
