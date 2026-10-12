import type { Meta, StoryObj } from '@storybook/react-vite';
import { BuildingOfType } from '../../../.storybook/BuildingOfType';
import { WithGameState } from '../../../.storybook/WithGameState';
import { isVenue, venuePerformance } from '../../core';
import { VenueHotelStats } from './VenueHotelStats';

const meta = { title: 'Venue/VenueHotelStats', parameters: { game: 'showcase' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Hotel: Story = {
  render: () => (
    <WithGameState>
      {(state) => (
        <BuildingOfType type="hotel">
          {(building) => (isVenue(building) ? <VenueHotelStats venue={building.venue} performance={venuePerformance(state, building)} /> : null)}
        </BuildingOfType>
      )}
    </WithGameState>
  ),
};
