import type { Meta, StoryObj } from '@storybook/react-vite';
import { OtherDeviceSetting } from './OtherDeviceSetting';

const meta = { title: 'System/OtherDeviceSetting', component: OtherDeviceSetting } satisfies Meta<typeof OtherDeviceSetting>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
