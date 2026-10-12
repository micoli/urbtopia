import type { Meta, StoryObj } from '@storybook/react-vite';
import { UrbsAmount } from '../common/UrbsAmount';
import { FlyoutItem } from './FlyoutItem';

const meta = {
  title: 'Layout/FlyoutItem',
  component: FlyoutItem,
  args: { label: 'Home', cost: <UrbsAmount value={250} />, onChoose: () => {} },
} satisfies Meta<typeof FlyoutItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithBadge: Story = { args: { badge: '2 left' } };
export const Selected: Story = { args: { selected: true } };
export const Guided: Story = { args: { guided: true } };
export const Disabled: Story = { args: { disabled: true } };
export const WithInfo: Story = { args: { codexId: 'home', onInfo: () => {} } };
