import type { Meta, StoryObj } from '@storybook/react-vite';
import { SlotList } from './SlotList';

const meta = { title: 'Common/SlotList', component: SlotList, args: { children: null } } satisfies Meta<typeof SlotList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <SlotList>
      <SlotList.Slot status="ready">Planks ready</SlotList.Slot>
      <SlotList.Slot progress={0.2}>Bricks 20 %</SlotList.Slot>
      <SlotList.Slot progress={0.6}>Tiles 60 %</SlotList.Slot>
      <SlotList.Slot progress={0.95}>Glass 95 %</SlotList.Slot>
      <SlotList.Slot status="free">Free slot</SlotList.Slot>
    </SlotList>
  ),
};
