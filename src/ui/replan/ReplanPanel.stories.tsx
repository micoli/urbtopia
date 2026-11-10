import type { Meta, StoryObj } from '@storybook/react-vite';
import { gameStore } from '../../store/gameStore';
import { ReplanPanel } from './ReplanPanel';

const meta = { title: 'System/Replan/ReplanPanel', component: ReplanPanel, parameters: { layout: 'fullscreen', game: 'evolved' } } satisfies Meta<typeof ReplanPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StashFull: Story = {
  parameters: { stores: { setup: () => gameStore.getState().send({ type: 'StartReplan' }) } },
};
