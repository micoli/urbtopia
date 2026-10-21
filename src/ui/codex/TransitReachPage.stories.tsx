import type { Meta, StoryObj } from '@storybook/react-vite';
import { TransitReachPage } from './TransitReachPage';

const meta = { title: 'Codex/TransitReachPage', component: TransitReachPage, parameters: { game: 'evolved' } } satisfies Meta<typeof TransitReachPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
