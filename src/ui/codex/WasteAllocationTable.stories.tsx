import type { Meta, StoryObj } from '@storybook/react-vite';
import { WasteAllocationTable } from './WasteAllocationTable';

const meta = {
  title: 'Codex/WasteAllocationTable',
  component: WasteAllocationTable,
  args: {
    kinds: [
      { kind: 'recyclingPlant', buildings: 1, capacity: 400, nominalCapacity: 400, processed: 400, cost: 2400, stopped: null, averageRoute: 12.5 },
      { kind: 'incinerator', buildings: 1, capacity: 800, nominalCapacity: 800, processed: 500, cost: 1500, stopped: null, averageRoute: 12.5 },
      { kind: 'mound', buildings: 0, capacity: 0, nominalCapacity: 0, processed: 0, cost: 0, stopped: null, averageRoute: 12.5 },
    ],
  },
  argTypes: { kinds: { control: 'object' } },
} satisfies Meta<typeof WasteAllocationTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
