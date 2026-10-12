import type { Meta, StoryObj } from '@storybook/react-vite';
import { BuildingOfType } from '../../../.storybook/BuildingOfType';
import { venueStore } from '../../store/venueStore';
import { VenueFlyout } from './VenueFlyout';

const meta = { title: 'Venue/VenueFlyout', parameters: { game: 'showcase' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const render = (type: 'arcade' | 'hotel' | 'supermarket'): Story['render'] => () => <BuildingOfType type={type}>{(building) => <VenueFlyout venue={building} />}</BuildingOfType>;

export const ArcadeBuild: Story = { render: render('arcade'), parameters: { stores: { setup: () => venueStore.getState().togglePanel('build') } } };
export const HotelBuild: Story = { render: render('hotel'), parameters: { stores: { setup: () => venueStore.getState().togglePanel('build') } } };
export const SupermarketBuild: Story = { render: render('supermarket'), parameters: { stores: { setup: () => venueStore.getState().togglePanel('build') } } };
