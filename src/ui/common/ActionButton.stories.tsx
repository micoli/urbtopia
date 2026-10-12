import type { Meta, StoryObj } from '@storybook/react-vite';
import { ActionButton } from './ActionButton';

const meta = {
  title: 'Common/ActionButton',
  component: ActionButton,
  args: { children: 'Build' },
  argTypes: { variant: { control: 'inline-radio', options: ['default', 'primary', 'danger'] } },
} satisfies Meta<typeof ActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Primary: Story = { args: { variant: 'primary' } };
export const Danger: Story = { args: { variant: 'danger', children: 'Demolish' } };
export const Block: Story = { args: { block: true }, decorators: [(Story) => <div style={{ width: 240 }}><Story /></div>] };
export const Disabled: Story = { args: { disabled: true } };
