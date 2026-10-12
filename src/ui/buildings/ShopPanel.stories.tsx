import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Building } from '../../core';
import { BuildingOfType } from '../../../.storybook/BuildingOfType';
import { ShopPanel } from './ShopPanel';

const meta = { title: 'Buildings/ShopPanel', parameters: { game: 'showcase' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Shop: Story = {
  render: () => (
    <BuildingOfType type="shop">{(building: Building) => <ShopPanel building={building} />}</BuildingOfType>
  ),
};
