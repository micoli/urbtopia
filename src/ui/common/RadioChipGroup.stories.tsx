import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioChipGroup } from './RadioChipGroup';

const OPTIONS = [
  { value: 1, label: 'x1' },
  { value: 5, label: 'x5' },
  { value: 10, label: 'x10', disabled: true },
];

const meta = {
  title: 'Common/RadioChipGroup',
  component: RadioChipGroup<number>,
  args: { label: 'Quantity', options: OPTIONS, value: 1, onChange: () => {} },
  argTypes: { variant: { control: 'inline-radio', options: ['radio', 'toggle'] } },
} satisfies Meta<typeof RadioChipGroup<number>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Radio: Story = {};
export const Toggle: Story = { args: { variant: 'toggle' } };
export const Disabled: Story = { args: { disabled: true } };

export const Interactive: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return <RadioChipGroup {...args} value={value} onChange={setValue} />;
  },
};
