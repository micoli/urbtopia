import type { Meta, StoryObj } from '@storybook/react-vite';
import { CODEX_ENTRIES } from '../../codex/catalog';
import { CodexEntryContent } from './CodexEntryContent';

const entry = (id: string) => CODEX_ENTRIES.find((candidate) => candidate.id === id)!;

const meta = { title: 'Codex/CodexEntryContent', component: CodexEntryContent, args: { entry: entry('home'), manifest: null }, parameters: { game: 'evolved' } } satisfies Meta<typeof CodexEntryContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Home: Story = {};
export const Workshop: Story = { args: { entry: entry('workshop') } };
export const Crop: Story = { args: { entry: entry('wheat') } };
