import type { Meta, StoryObj } from '@storybook/react-vite';
import { BuildingOfType } from '../../../.storybook/BuildingOfType';
import { venueStore } from '../../store/venueStore';
import { VenueFixturePanel } from './VenueFixturePanel';

const meta = { title: 'Venue/VenueFixturePanel', parameters: { game: 'showcase' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Arcade: Story = {
  parameters: { stores: { setup: () => venueStore.getState().selectPlaced(1) } },
  render: () => <BuildingOfType type="arcade">{(building) => <VenueFixturePanel venueId={building.id} />}</BuildingOfType>,
};
