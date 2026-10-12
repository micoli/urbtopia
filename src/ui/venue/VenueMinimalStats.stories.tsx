import type { Meta, StoryObj } from '@storybook/react-vite';
import { BuildingOfType } from '../../../.storybook/BuildingOfType';
import { VenueMinimalStats } from './VenueMinimalStats';

const meta = { title: 'Venue/VenueMinimalStats', parameters: { game: 'showcase' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Arcade: Story = {
  render: () => <BuildingOfType type="arcade">{(building) => <VenueMinimalStats venue={building} />}</BuildingOfType>,
};

export const Hotel: Story = {
  render: () => <BuildingOfType type="hotel">{(building) => <VenueMinimalStats venue={building} />}</BuildingOfType>,
};

export const Supermarket: Story = {
  render: () => <BuildingOfType type="supermarket">{(building) => <VenueMinimalStats venue={building} />}</BuildingOfType>,
};
