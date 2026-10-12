import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Building } from '../../core';
import { BuildingOfType } from '../../../.storybook/BuildingOfType';
import { StopNameField } from './StopNameField';

const meta = { title: 'Buildings/StopNameField', parameters: { game: 'showcase' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const BusStop: Story = {
  render: () => (
    <BuildingOfType type="busStop">{(building: Building) => <StopNameField building={building} />}</BuildingOfType>
  ),
};
