import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Building } from '../../core';
import { BuildingOfType } from '../../../.storybook/BuildingOfType';
import { TownHallPanel } from './TownHallPanel';

const meta = { title: 'Politics/TownHallPanel', parameters: { game: 'political' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Medium: Story = {
  render: () => <BuildingOfType type="townHall">{(building: Building) => <TownHallPanel building={building} />}</BuildingOfType>,
};
export const Cozy: Story = { ...Medium, parameters: { game: 'showcase' } };
