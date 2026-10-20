import type { Meta, StoryObj } from '@storybook/react-vite';
import { PoliticsPage } from './PoliticsPage';

const meta = { title: 'Codex/PoliticsPage', component: PoliticsPage, parameters: { game: 'political' } } satisfies Meta<typeof PoliticsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Cozy: Story = { parameters: { game: 'starter' } };
