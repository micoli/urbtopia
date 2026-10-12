import type { Meta, StoryObj } from '@storybook/react-vite';
import { HydroFlowRow } from './HydroFlowRow';

const meta = { title: 'Codex/HydroFlowRow', component: HydroFlowRow, args: { tier: 1, tiles: 6 } } satisfies Meta<typeof HydroFlowRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const HigherTier: Story = { args: { tier: 3, tiles: 20 } };
