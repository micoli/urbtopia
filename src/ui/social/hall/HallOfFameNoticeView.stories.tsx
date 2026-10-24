import type { Meta, StoryObj } from '@storybook/react-vite';
import { HallOfFameNoticeView } from './HallOfFameNoticeView';

const meta = { title: 'Social/HallOfFameNotice', component: HallOfFameNoticeView, args: { onKeep: () => {}, onOptOut: () => {} } } satisfies Meta<typeof HallOfFameNoticeView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
