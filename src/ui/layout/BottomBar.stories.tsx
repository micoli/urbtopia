import type { Meta, StoryObj } from '@storybook/react-vite';
import { BottomBar } from './BottomBar';

const meta = { title: 'Layout/BottomBar', component: BottomBar, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof BottomBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
