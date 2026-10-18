import type { Meta, StoryObj } from '@storybook/react-vite';
import { WasteAllocationRow } from './WasteAllocationRow';

const meta = {
  title: 'Codex/WasteAllocationRow',
  component: WasteAllocationRow,
  args: { figures: { kind: 'incinerator', buildings: 2, capacity: 2300, processed: 1200, cost: 3600, stopped: null } },
  argTypes: { figures: { control: 'object' } },
} satisfies Meta<typeof WasteAllocationRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Running: Story = {};
export const NoUrbs: Story = { args: { figures: { kind: 'mound', buildings: 3, capacity: 180, processed: 0, cost: 0, stopped: 'noUrbs' } } };
export const PowerShortage: Story = { args: { figures: { kind: 'recyclingPlant', buildings: 1, capacity: 400, processed: 0, cost: 0, stopped: 'powerShortage' } } };
export const NoneBuilt: Story = { args: { figures: { kind: 'recyclingPlant', buildings: 0, capacity: 0, processed: 0, cost: 0, stopped: null } } };
