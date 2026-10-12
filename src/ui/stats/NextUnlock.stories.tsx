import type { Meta, StoryObj } from '@storybook/react-vite';
import { NextUnlock } from './NextUnlock';

const meta = { title: 'Stats/NextUnlock', component: NextUnlock } satisfies Meta<typeof NextUnlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
