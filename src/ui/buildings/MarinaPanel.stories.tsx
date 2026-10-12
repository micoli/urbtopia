import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Building } from '../../core';
import { BuildingOfType } from '../../../.storybook/BuildingOfType';
import { MarinaPanel } from './MarinaPanel';

const meta = { title: 'Buildings/MarinaPanel', parameters: { game: 'showcase' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Marina: Story = {
  render: () => (
    <BuildingOfType type="marina">{(building: Building) => <MarinaPanel building={building} />}</BuildingOfType>
  ),
};
