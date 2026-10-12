import type { Meta, StoryObj } from '@storybook/react-vite';
import { BuildingOfType } from '../../../.storybook/BuildingOfType';
import type { CasinoGame } from '../../core';
import { CasinoGameView } from './CasinoGameView';

const meta = { title: 'Casino/CasinoGameView', parameters: { game: 'showcase', layout: 'fullscreen' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const gameView = (game: CasinoGame): Story => ({
  render: () => <BuildingOfType type="casino">{(building) => <CasinoGameView game={game} casino={building} />}</BuildingOfType>,
});

export const SlotMachine: Story = gameView('slotMachine');
export const Blackjack: Story = gameView('blackjack');
export const Blockmatch: Story = gameView('blockmatch');
