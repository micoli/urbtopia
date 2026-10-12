import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { InlineConfirm } from './InlineConfirm';

const meta = {
  title: 'Common/InlineConfirm',
  component: InlineConfirm,
  args: { confirming: false, triggerLabel: 'Sell', confirmLabel: 'Sell for 120', message: 'Sell this building?', onRequest: () => {}, onCancel: () => {}, onConfirm: () => {} },
} satisfies Meta<typeof InlineConfirm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {};
export const Confirming: Story = { args: { confirming: true } };

export const Interactive: Story = {
  render: (args) => {
    const [confirming, setConfirming] = useState(false);
    return <InlineConfirm {...args} confirming={confirming} onRequest={() => setConfirming(true)} onCancel={() => setConfirming(false)} onConfirm={() => setConfirming(false)} />;
  },
};
