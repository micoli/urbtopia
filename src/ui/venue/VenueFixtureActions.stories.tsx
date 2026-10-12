import type { Meta, StoryObj } from '@storybook/react-vite';
import { BuildingOfType } from '../../../.storybook/BuildingOfType';
import { venueStore } from '../../store/venueStore';
import { VenueFixtureActions } from './VenueFixtureActions';

const meta = { title: 'Venue/VenueFixtureActions', parameters: { game: 'showcase' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Arcade: Story = {
  parameters: { stores: { setup: () => venueStore.getState().selectPlaced(1) } },
  render: () => <BuildingOfType type="arcade">{(building) => <VenueFixtureActions venueId={building.id} />}</BuildingOfType>,
};
