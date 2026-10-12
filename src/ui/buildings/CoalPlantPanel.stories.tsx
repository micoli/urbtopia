import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Building } from '../../core';
import { BuildingOfType } from '../../../.storybook/BuildingOfType';
import { CoalPlantPanel } from './CoalPlantPanel';

const meta = { title: 'Buildings/CoalPlantPanel', parameters: { game: 'showcase' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const CoalPlant: Story = {
  render: () => (
    <BuildingOfType type="coalPlant">{(building: Building) => <CoalPlantPanel building={building} />}</BuildingOfType>
  ),
};
