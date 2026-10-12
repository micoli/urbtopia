import type { Meta, StoryObj } from '@storybook/react-vite';
import { Note } from './Note';

const meta = {
  title: 'Common/Note',
  component: Note,
  args: { children: 'Not enough power to run this building.' },
  argTypes: { tone: { control: 'inline-radio', options: ['warn', 'muted'] } },
} satisfies Meta<typeof Note>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Warn: Story = {};
export const Muted: Story = { args: { tone: 'muted' } };
