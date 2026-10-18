import type { Meta, StoryObj } from '@storybook/react-vite';
import { AnnualEventNoticeBanner } from './AnnualEventNoticeBanner';

const meta = {
  title: 'System/AnnualEventNoticeBanner',
  component: AnnualEventNoticeBanner,
  parameters: { layout: 'fullscreen' },
  args: { eventName: 'Halloween', endDate: '14 November', onSee: () => {}, onDismiss: () => {} },
} satisfies Meta<typeof AnnualEventNoticeBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};
