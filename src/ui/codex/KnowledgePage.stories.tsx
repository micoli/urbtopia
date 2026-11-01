import type { Meta, StoryObj } from '@storybook/react-vite';
import { KnowledgePage } from './KnowledgePage';

const meta = { title: 'Codex/KnowledgePage', component: KnowledgePage, parameters: { game: 'evolved' } } satisfies Meta<typeof KnowledgePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
