import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Building } from '../../core';
import { BuildingOfType } from '../../../.storybook/BuildingOfType';
import { SolarPanelsRow } from './SolarPanelsRow';

const meta = { title: 'Buildings/SolarPanelsRow', parameters: { game: 'showcase' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Home: Story = {
  render: () => (
    <BuildingOfType type="home">{(building: Building) => <SolarPanelsRow building={building} />}</BuildingOfType>
  ),
};
