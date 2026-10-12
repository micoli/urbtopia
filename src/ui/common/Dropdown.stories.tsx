import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Dropdown } from './Dropdown';

const OPTIONS = [
  { value: 'bricks', label: 'Bricks' },
  { value: 'planks', label: 'Planks' },
  { value: 'glass', label: 'Glass', disabled: true },
  { value: 'steel', label: 'Steel' },
];

const meta = {
  title: 'Common/Dropdown',
  component: Dropdown<string>,
  args: { label: 'Good', options: OPTIONS, placeholder: 'Choose a good', onChange: () => {} },
  decorators: [(Story) => <div style={{ minHeight: 200, width: 220 }}><Story /></div>],
} satisfies Meta<typeof Dropdown<string>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Placeholder: Story = {};
export const Selected: Story = { args: { value: 'planks' } };
export const Disabled: Story = { args: { value: 'planks', disabled: true } };

export const Interactive: Story = {
  render: (args) => {
    const [value, setValue] = useState<string>();
    return <Dropdown {...args} value={value} onChange={setValue} />;
  },
};
