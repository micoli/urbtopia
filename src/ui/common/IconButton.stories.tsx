import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconButton } from './IconButton';

const meta = {
  title: 'Common/IconButton',
  component: IconButton,
  args: { label: 'Add', children: '+' },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    tone: { control: 'inline-radio', options: ['subtle', 'light', 'accent', 'danger'] },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Large: Story = { args: { size: 'lg' } };
export const Accent: Story = { args: { tone: 'accent' } };
export const Danger: Story = { args: { tone: 'danger', children: '✕', label: 'Delete' } };
export const Disabled: Story = { args: { disabled: true } };
