import type { Meta, StoryObj } from '@storybook/react-vite';
import { NextUnlockSection } from './NextUnlockSection';

const meta = { title: 'Stats/NextUnlockSection', component: NextUnlockSection } satisfies Meta<typeof NextUnlockSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Starter: Story = {};
export const Evolved: Story = { parameters: { game: 'evolved' } };
