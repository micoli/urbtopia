import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Building } from '../../core';
import { BuildingOfType } from '../../../.storybook/BuildingOfType';
import { StoragePanel } from './StoragePanel';

const meta = { title: 'Buildings/StoragePanel', parameters: { game: 'showcase' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Storehouse: Story = {
  render: () => (
    <BuildingOfType type="storehouse">{(building: Building) => <StoragePanel building={building} />}</BuildingOfType>
  ),
};

export const MaterialDepot: Story = {
  render: () => (
    <BuildingOfType type="materialDepot">{(building: Building) => <StoragePanel building={building} />}</BuildingOfType>
  ),
};

export const GrainSilo: Story = {
  render: () => (
    <BuildingOfType type="grainSilo">{(building: Building) => <StoragePanel building={building} />}</BuildingOfType>
  ),
};
