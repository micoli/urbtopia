import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Building } from '../../core';
import { BuildingOfType } from '../../../.storybook/BuildingOfType';
import { FarmPanel } from './FarmPanel';

const meta = { title: 'Buildings/FarmPanel', parameters: { game: 'showcase' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Farm: Story = {
  render: () => (
    <BuildingOfType type="farm">{(building: Building) => <FarmPanel building={building} />}</BuildingOfType>
  ),
};
