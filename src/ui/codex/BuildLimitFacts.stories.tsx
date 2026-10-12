import type { Meta, StoryObj } from '@storybook/react-vite';
import { BuildLimitFacts } from './BuildLimitFacts';

const meta = { title: 'Codex/BuildLimitFacts', component: BuildLimitFacts, args: { id: 'farm' }, parameters: { game: 'evolved' } } satisfies Meta<typeof BuildLimitFacts>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Farm: Story = {};
export const GrainSilo: Story = { args: { id: 'grainSilo' } };
export const HydroPlant: Story = { args: { id: 'hydroPlant' } };
