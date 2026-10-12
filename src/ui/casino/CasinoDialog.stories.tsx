import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CasinoGame } from '../../core';
import { casinoStore } from '../../store/casinoStore';
import { gameStore } from '../../store/gameStore';
import { CasinoDialog } from './CasinoDialog';

const meta = { title: 'Casino/CasinoDialog', component: CasinoDialog, parameters: { game: 'showcase', layout: 'fullscreen' } } satisfies Meta<typeof CasinoDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const playing = (game: CasinoGame): Story => ({
  parameters: {
    stores: {
      setup: () => {
        const casino = gameStore.getState().state.buildings.find((building) => building.type === 'casino');
        if (casino) casinoStore.getState().play(casino.id, game);
      },
    },
  },
});

export const SlotMachine: Story = playing('slotMachine');
export const Blackjack: Story = playing('blackjack');
export const Blockmatch: Story = playing('blockmatch');
