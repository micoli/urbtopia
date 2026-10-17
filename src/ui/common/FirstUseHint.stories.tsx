import type { Meta, StoryObj } from '@storybook/react-vite';
import { FirstUseHint } from './FirstUseHint';

const meta = { title: 'Common/FirstUseHint', component: FirstUseHint, args: { id: 'build', children: 'Pick a building, then tap the map to place it.' } } satisfies Meta<typeof FirstUseHint>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
