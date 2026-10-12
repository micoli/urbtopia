import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Building } from '../../core';
import { BuildingOfType } from '../../../.storybook/BuildingOfType';
import { ProductionPanel } from './ProductionPanel';

const meta = { title: 'Buildings/ProductionPanel', parameters: { game: 'showcase' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Workshop: Story = {
  render: () => (
    <BuildingOfType type="workshop">{(building: Building) => <ProductionPanel building={building} />}</BuildingOfType>
  ),
};

export const Factory: Story = {
  render: () => (
    <BuildingOfType type="factory">{(building: Building) => <ProductionPanel building={building} />}</BuildingOfType>
  ),
};

export const Packhouse: Story = {
  render: () => (
    <BuildingOfType type="packhouse">{(building: Building) => <ProductionPanel building={building} />}</BuildingOfType>
  ),
};
