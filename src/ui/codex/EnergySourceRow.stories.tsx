import type { Meta, StoryObj } from '@storybook/react-vite';
import { EnergySourceRow } from './EnergySourceRow';

const meta = {
  title: 'Codex/EnergySourceRow',
  component: EnergySourceRow,
  args: { source: { id: 'wind', copies: 3, capacity: 120, output: 84 }, factor: 0.7, demand: 100 },
  argTypes: { source: { control: 'object' } },
} satisfies Meta<typeof EnergySourceRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Wind: Story = {};
export const Solar: Story = { args: { source: { id: 'solar', copies: 5, capacity: 60, output: 20 }, factor: 0.33 } };
export const Coal: Story = { args: { source: { id: 'coal', copies: 1, capacity: 200, output: 200 }, factor: 1 } };
export const Hydro: Story = { args: { source: { id: 'hydro', copies: 2, capacity: 80, output: 40 }, factor: 0.5 } };
export const Geothermal: Story = { args: { source: { id: 'geothermal', copies: 1, capacity: 150, output: 150 }, factor: 1 } };
