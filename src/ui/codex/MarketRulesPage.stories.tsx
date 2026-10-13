import type { Meta, StoryObj } from '@storybook/react-vite';
import { MarketRulesPage } from './MarketRulesPage';

const meta = { title: 'Codex/MarketRulesPage', component: MarketRulesPage, parameters: { game: 'evolved' } } satisfies Meta<typeof MarketRulesPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
