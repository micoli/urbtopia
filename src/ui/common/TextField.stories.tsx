import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextField } from './TextField';

const meta = {
  title: 'Common/TextField',
  component: TextField,
  args: { label: 'City name', value: 'Riverside', onChange: () => {} },
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Filled: Story = {};
export const Placeholder: Story = { args: { value: '', placeholder: 'Riverside' } };

export const Interactive: Story = {
  render: (args) => {
    const [value, setValue] = useState('Riverside');
    return <TextField {...args} value={value} onChange={setValue} />;
  },
};
