import type { Meta, StoryObj } from '@storybook/react-vite';
import { AvatarImage } from './AvatarImage';

const meta = { title: 'Social/AvatarImage', component: AvatarImage, args: { userId: 'user-1', avatar: 'character-female-a' } } satisfies Meta<typeof AvatarImage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Chosen: Story = {};
export const DefaultForUser: Story = { args: { avatar: null } };
