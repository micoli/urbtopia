import type { Meta, StoryObj } from '@storybook/react-vite';
import { SanctionsPage } from './SanctionsPage';

const meta = { title: 'Codex/SanctionsPage', component: SanctionsPage, parameters: { game: 'evolved' } } satisfies Meta<typeof SanctionsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
