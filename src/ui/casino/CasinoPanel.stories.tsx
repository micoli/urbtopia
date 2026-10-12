import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Building } from '../../core';
import { BuildingOfType } from '../../../.storybook/BuildingOfType';
import { CasinoPanel } from './CasinoPanel';

const meta = { title: 'Casino/CasinoPanel', parameters: { game: 'showcase' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Casino: Story = {
  render: () => (
    <BuildingOfType type="casino">{(building: Building) => <CasinoPanel building={building} />}</BuildingOfType>
  ),
};
