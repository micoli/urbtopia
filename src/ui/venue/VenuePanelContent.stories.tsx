import type { Meta, StoryObj } from '@storybook/react-vite';
import { BuildingOfType } from '../../../.storybook/BuildingOfType';
import { venueStore } from '../../store/venueStore';
import { VenuePanelContent } from './VenuePanelContent';

const meta = { title: 'Venue/VenuePanelContent', parameters: { game: 'showcase' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const render = (type: 'arcade' | 'hotel' | 'supermarket'): Story['render'] => () => <BuildingOfType type={type}>{(building) => <VenuePanelContent venue={building} />}</BuildingOfType>;

export const Build: Story = { render: render('arcade'), parameters: { stores: { setup: () => venueStore.getState().togglePanel('build') } } };
export const Staff: Story = { render: render('arcade'), parameters: { stores: { setup: () => venueStore.getState().togglePanel('staff') } } };
export const Events: Story = { render: render('arcade'), parameters: { stores: { setup: () => venueStore.getState().togglePanel('events') } } };
export const Takings: Story = { render: render('arcade'), parameters: { stores: { setup: () => venueStore.getState().togglePanel('takings') } } };
export const HotelStaff: Story = { render: render('hotel'), parameters: { stores: { setup: () => venueStore.getState().togglePanel('staff') } } };
export const SupermarketTakings: Story = { render: render('supermarket'), parameters: { stores: { setup: () => venueStore.getState().togglePanel('takings') } } };
