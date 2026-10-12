import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DifficultyChoice } from './DifficultyChoice';

const meta = { title: 'System/DifficultyChoice', component: DifficultyChoice, args: { label: 'Difficulty', value: 'medium', onChange: () => {} } } satisfies Meta<typeof DifficultyChoice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Interactive: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return <DifficultyChoice {...args} value={value} onChange={setValue} />;
  },
};
