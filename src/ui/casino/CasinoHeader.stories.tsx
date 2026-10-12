import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CasinoHeader } from './CasinoHeader';

const meta = {
  title: 'Casino/CasinoHeader',
  component: CasinoHeader,
  args: { spent: 200, won: 350, steps: [10, 25, 50, 100], urbs: 500, stake: 25, onStake: () => {} },
} satisfies Meta<typeof CasinoHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Locked: Story = { args: { locked: true } };

export const Interactive: Story = {
  render: (args) => {
    const [stake, setStake] = useState(args.stake);
    return <CasinoHeader {...args} stake={stake} onStake={setStake} />;
  },
};
