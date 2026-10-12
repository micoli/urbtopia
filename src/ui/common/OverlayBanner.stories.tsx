import type { Meta, StoryObj } from '@storybook/react-vite';
import { ActionButton } from './ActionButton';
import { OverlayBanner } from './OverlayBanner';

const meta = {
  title: 'Common/OverlayBanner',
  component: OverlayBanner,
  parameters: { layout: 'fullscreen' },
  args: { variant: 'banner', message: 'A new version is available.', children: <ActionButton variant="primary">Reload</ActionButton> },
  argTypes: { variant: { control: 'inline-radio', options: ['banner', 'reminder'] } },
} satisfies Meta<typeof OverlayBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Banner: Story = {};
export const Reminder: Story = { args: { variant: 'reminder', message: 'Export your city to keep a backup.' } };
export const Alert: Story = { args: { role: 'alert', message: 'Saving failed.' } };
