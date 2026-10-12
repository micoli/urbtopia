import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Building } from '../../core';
import { BuildingOfType } from '../../../.storybook/BuildingOfType';
import { FrontRotation } from './FrontRotation';

const meta = { title: 'Buildings/FrontRotation', parameters: { game: 'showcase' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Home: Story = {
  render: () => (
    <BuildingOfType type="home">{(building: Building) => <FrontRotation building={building} />}</BuildingOfType>
  ),
};
