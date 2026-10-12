import type { Meta, StoryObj } from '@storybook/react-vite';
import { BuildingOfType } from '../../../.storybook/BuildingOfType';
import { VenueStaff } from './VenueStaff';

const meta = { title: 'Venue/VenueStaff', parameters: { game: 'showcase' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Arcade: Story = {
  render: () => <BuildingOfType type="arcade">{(building) => <VenueStaff venueId={building.id} />}</BuildingOfType>,
};

export const Hotel: Story = {
  render: () => <BuildingOfType type="hotel">{(building) => <VenueStaff venueId={building.id} />}</BuildingOfType>,
};

export const Supermarket: Story = {
  render: () => <BuildingOfType type="supermarket">{(building) => <VenueStaff venueId={building.id} />}</BuildingOfType>,
};
