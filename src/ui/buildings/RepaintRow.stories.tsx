import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Building } from '../../core';
import { BuildingOfType } from '../../../.storybook/BuildingOfType';
import { RepaintRow } from './RepaintRow';

const meta = { title: 'Buildings/RepaintRow', parameters: { game: 'showcase' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Home: Story = {
  render: () => (
    <BuildingOfType type="home">{(building: Building) => <RepaintRow building={building} />}</BuildingOfType>
  ),
};
