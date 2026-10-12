import type { Meta, StoryObj } from '@storybook/react-vite';
import { HandleLabel } from './HandleLabel';

const meta = { title: 'Social/HandleLabel', component: HandleLabel, args: { userId: 'user-1', handle: 'MayorStory', avatar: 'character-male-c' } } satisfies Meta<typeof HandleLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithoutAvatar: Story = { args: { avatar: null } };
