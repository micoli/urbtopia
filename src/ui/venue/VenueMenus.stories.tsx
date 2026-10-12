import type { Meta, StoryObj } from '@storybook/react-vite';
import { BuildingOfType } from '../../../.storybook/BuildingOfType';
import { VenueMenus } from './VenueMenus';

const meta = { title: 'Venue/VenueMenus', parameters: { game: 'showcase', layout: 'fullscreen' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Arcade: Story = {
  render: () => <BuildingOfType type="arcade">{(building) => <VenueMenus venue={building} />}</BuildingOfType>,
};

export const Hotel: Story = {
  render: () => <BuildingOfType type="hotel">{(building) => <VenueMenus venue={building} />}</BuildingOfType>,
};

export const Supermarket: Story = {
  render: () => <BuildingOfType type="supermarket">{(building) => <VenueMenus venue={building} />}</BuildingOfType>,
};
