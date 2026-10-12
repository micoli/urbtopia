import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Building, UtilityType } from '../../core';
import { BuildingOfType } from '../../../.storybook/BuildingOfType';
import { UtilityPanel } from './UtilityPanel';

const meta = { title: 'Buildings/UtilityPanel', parameters: { game: 'showcase' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const utility = (type: UtilityType): Story => ({
  render: () => <BuildingOfType type={type}>{(building: Building) => <UtilityPanel building={building} type={type} />}</BuildingOfType>,
});

export const PowerPlant: Story = utility('powerPlant');
export const WaterTower: Story = utility('waterTower');
export const HydroPlant: Story = utility('hydroPlant');
