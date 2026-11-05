import type { Meta, StoryObj } from '@storybook/react-vite';
import { DayCyclePage } from './DayCyclePage';

const meta = { title: 'Codex/DayCyclePage', component: DayCyclePage, parameters: { game: 'evolved' } } satisfies Meta<typeof DayCyclePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
