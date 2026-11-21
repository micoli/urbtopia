import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextFieldWithEditor } from './TextFieldWithEditor';

const meta = {
  title: 'Common/TextFieldWithEditor',
  component: TextFieldWithEditor,
  args: { label: 'Plan name', value: 'Plan 1', onChange: () => {} },
} satisfies Meta<typeof TextFieldWithEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Filled: Story = {};

export const Interactive: Story = {
  render: (args) => {
    const [value, setValue] = useState('Plan 1');
    return <TextFieldWithEditor {...args} value={value} onChange={setValue} />;
  },
};
