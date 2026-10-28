import type { Meta, StoryObj } from '@storybook/react-vite';
import { NavIcon } from './NavIcon';

const meta = { title: 'Layout/NavIcon', component: NavIcon, args: { action: { icon: 'settings' } } } satisfies Meta<typeof NavIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Emoji: Story = {};
