import type { Meta, StoryObj } from '@storybook/react-vite';
import { NavActionButton } from './NavActionButton';
import type { NavAction } from './useNavActions';

const action: NavAction = { id: 'social', icon: 'globe', label: 'Social', pressed: false, disabled: false, guided: false, badge: 2, onClick: () => {} };

const meta = {
  title: 'Layout/NavActionButton',
  component: NavActionButton,
  args: { action, variant: 'dock' },
  argTypes: { variant: { control: 'inline-radio', options: ['dock', 'bar', 'radial'] } },
} satisfies Meta<typeof NavActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Dock: Story = {};
export const Bar: Story = { args: { variant: 'bar' } };
export const Radial: Story = { args: { variant: 'radial' } };
export const Pressed: Story = { args: { action: { ...action, pressed: true } } };
export const Disabled: Story = { args: { action: { ...action, disabled: true } } };
export const Guided: Story = { args: { action: { ...action, guided: true } } };
