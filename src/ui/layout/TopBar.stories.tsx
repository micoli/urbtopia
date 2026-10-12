import type { Meta, StoryObj } from '@storybook/react-vite';
import { TopBar } from './TopBar';

const meta = { title: 'Layout/TopBar', component: TopBar, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof TopBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const CustomContent: Story = { args: { children: 'Custom content' } };
