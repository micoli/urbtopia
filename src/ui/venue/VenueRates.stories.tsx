import type { Meta, StoryObj } from '@storybook/react-vite';
import { BuildingOfType } from '../../../.storybook/BuildingOfType';
import { VenueRates } from './VenueRates';

const meta = { title: 'Venue/VenueRates', parameters: { game: 'showcase' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Arcade: Story = {
  render: () => <BuildingOfType type="arcade">{(building) => <VenueRates venue={building} />}</BuildingOfType>,
};

export const Hotel: Story = {
  render: () => <BuildingOfType type="hotel">{(building) => <VenueRates venue={building} />}</BuildingOfType>,
};

export const Supermarket: Story = {
  render: () => <BuildingOfType type="supermarket">{(building) => <VenueRates venue={building} />}</BuildingOfType>,
};
