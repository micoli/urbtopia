import type { Meta, StoryObj } from '@storybook/react-vite';
import { WastePage } from './WastePage';

const meta = { title: 'Codex/WastePage', component: WastePage, parameters: { game: 'evolved' } } satisfies Meta<typeof WastePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
