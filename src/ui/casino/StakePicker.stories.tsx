import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { StakePicker } from './StakePicker';

const meta = {
  title: 'Casino/StakePicker',
  component: StakePicker,
  args: { steps: [10, 25, 50, 100, 250], urbs: 120, value: 25, onChange: () => {} },
} satisfies Meta<typeof StakePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const Broke: Story = { args: { urbs: 5, value: 10 } };

export const Interactive: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return <StakePicker {...args} value={value} onChange={setValue} />;
  },
};
