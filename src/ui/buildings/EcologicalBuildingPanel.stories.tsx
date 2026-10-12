import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Building } from '../../core';
import { BuildingOfType } from '../../../.storybook/BuildingOfType';
import { EcologicalBuildingPanel } from './EcologicalBuildingPanel';

const meta = { title: 'Buildings/EcologicalBuildingPanel', parameters: { game: 'showcase' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Battery: Story = {
  render: () => (
    <BuildingOfType type="battery">{(building: Building) => <EcologicalBuildingPanel building={building} />}</BuildingOfType>
  ),
};

export const Solar: Story = {
  render: () => (
    <BuildingOfType type="solar">{(building: Building) => <EcologicalBuildingPanel building={building} />}</BuildingOfType>
  ),
};

export const Backup: Story = {
  render: () => (
    <BuildingOfType type="backup">{(building: Building) => <EcologicalBuildingPanel building={building} />}</BuildingOfType>
  ),
};
