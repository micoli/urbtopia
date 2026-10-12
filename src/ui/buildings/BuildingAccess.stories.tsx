import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Building } from '../../core';
import { BuildingOfType } from '../../../.storybook/BuildingOfType';
import { BuildingAccess } from './BuildingAccess';

const meta = { title: 'Buildings/BuildingAccess', parameters: { game: 'showcase' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Home: Story = {
  render: () => (
    <BuildingOfType type="home">{(building: Building) => <BuildingAccess building={building} />}</BuildingOfType>
  ),
};
