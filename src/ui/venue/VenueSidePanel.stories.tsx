import type { Meta, StoryObj } from '@storybook/react-vite';
import { BuildingOfType } from '../../../.storybook/BuildingOfType';
import { venueStore } from '../../store/venueStore';
import { VenueSidePanel } from './VenueSidePanel';

const meta = { title: 'Venue/VenueSidePanel', parameters: { game: 'showcase' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const render = (type: 'arcade' | 'hotel' | 'supermarket'): Story['render'] => () => <BuildingOfType type={type}>{(building) => <VenueSidePanel venue={building} />}</BuildingOfType>;

export const Staff: Story = { render: render('arcade'), parameters: { stores: { setup: () => venueStore.getState().togglePanel('staff') } } };
export const Events: Story = { render: render('arcade'), parameters: { stores: { setup: () => venueStore.getState().togglePanel('events') } } };
export const Takings: Story = { render: render('arcade'), parameters: { stores: { setup: () => venueStore.getState().togglePanel('takings') } } };
export const SelectedFixture: Story = { render: render('arcade'), parameters: { stores: { setup: () => venueStore.getState().selectPlaced(1) } } };
