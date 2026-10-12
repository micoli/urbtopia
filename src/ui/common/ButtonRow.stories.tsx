import type { Meta, StoryObj } from '@storybook/react-vite';
import { ActionButton } from './ActionButton';
import { ButtonRow } from './ButtonRow';

const meta = {
  title: 'Common/ButtonRow',
  component: ButtonRow,
  args: { children: [<ActionButton key="a">Cancel</ActionButton>, <ActionButton key="b" variant="primary">Confirm</ActionButton>] },
  argTypes: { align: { control: 'inline-radio', options: ['start', 'end', 'stretch'] } },
  decorators: [(Story) => <div style={{ width: 320 }}><Story /></div>],
} satisfies Meta<typeof ButtonRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Stretch: Story = {};
export const Start: Story = { args: { align: 'start' } };
export const End: Story = { args: { align: 'end' } };
export const Column: Story = { args: { column: true } };
export const Spaced: Story = { args: { spaced: true } };
