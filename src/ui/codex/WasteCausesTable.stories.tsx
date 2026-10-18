import type { Meta, StoryObj } from '@storybook/react-vite';
import { WasteCausesTable } from './WasteCausesTable';

const meta = {
  title: 'Codex/WasteCausesTable',
  component: WasteCausesTable,
  args: { causes: { outOfReach: 4, capacityFull: 2, noRoadLink: 1, beyondCarryingDistance: 3, facilityStopped: 0 } },
  argTypes: { causes: { control: 'object' } },
} satisfies Meta<typeof WasteCausesTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
