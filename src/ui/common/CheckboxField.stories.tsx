import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CheckboxField } from './CheckboxField';

const meta = {
  title: 'Common/CheckboxField',
  component: CheckboxField,
  args: { label: 'Show traffic', checked: false, onChange: () => {} },
} satisfies Meta<typeof CheckboxField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};
export const Checked: Story = { args: { checked: true } };

export const Interactive: Story = {
  render: (args) => {
    const [checked, setChecked] = useState(false);
    return <CheckboxField {...args} checked={checked} onChange={setChecked} />;
  },
};
