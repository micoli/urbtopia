import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { NumberStepper } from './NumberStepper';

const meta = {
  title: 'Common/NumberStepper',
  component: NumberStepper,
  args: { label: 'Tiles', value: 3, min: 1, max: 6, onChange: () => {} },
} satisfies Meta<typeof NumberStepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const AtMinimum: Story = { args: { value: 1 } };
export const AtMaximum: Story = { args: { value: 6 } };

export const Interactive: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return <NumberStepper {...args} value={value} onChange={setValue} />;
  },
};
