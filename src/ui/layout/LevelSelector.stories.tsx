import type { Meta, StoryObj } from '@storybook/react-vite';
import { LevelSelector } from './LevelSelector';

const meta = { title: 'Layout/LevelSelector', component: LevelSelector, parameters: { game: 'evolved' } } satisfies Meta<typeof LevelSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Surface: Story = {};
export const UndergroundLevel: Story = { parameters: { stores: { ui: { level: -1 } } } };
