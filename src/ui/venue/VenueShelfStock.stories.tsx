import type { Meta, StoryObj } from '@storybook/react-vite';
import { BuildingOfType } from '../../../.storybook/BuildingOfType';
import { isVenue, isShelf } from '../../core';
import { VenueShelfStock } from './VenueShelfStock';

const meta = { title: 'Venue/VenueShelfStock', parameters: { game: 'showcase' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Supermarket: Story = {
  render: () => (
    <BuildingOfType type="supermarket">
      {(building) => {
        const shelf = isVenue(building) ? building.venue.fixtures.find(isShelf) : undefined;
        if (!shelf) throw new Error('The supermarket fixture has no shelf');
        return <VenueShelfStock venueId={building.id} fixture={shelf} />;
      }}
    </BuildingOfType>
  ),
};
