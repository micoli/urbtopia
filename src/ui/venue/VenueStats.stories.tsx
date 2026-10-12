import type { Meta, StoryObj } from '@storybook/react-vite';
import { BuildingOfType } from '../../../.storybook/BuildingOfType';
import { VenueStats } from './VenueStats';

const meta = { title: 'Venue/VenueStats', parameters: { game: 'showcase' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Arcade: Story = {
  render: () => <BuildingOfType type="arcade">{(building) => <VenueStats venue={building} />}</BuildingOfType>,
};

export const Hotel: Story = {
  render: () => <BuildingOfType type="hotel">{(building) => <VenueStats venue={building} />}</BuildingOfType>,
};

export const Supermarket: Story = {
  render: () => <BuildingOfType type="supermarket">{(building) => <VenueStats venue={building} />}</BuildingOfType>,
};
