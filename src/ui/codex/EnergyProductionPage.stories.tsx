import type { Meta, StoryObj } from '@storybook/react-vite';
import { EnergyProductionPage } from './EnergyProductionPage';

const meta = { title: 'Codex/EnergyProductionPage', component: EnergyProductionPage, parameters: { game: 'showcase' } } satisfies Meta<typeof EnergyProductionPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Showcase: Story = {};
export const Starter: Story = { parameters: { game: 'starter' } };
