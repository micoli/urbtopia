import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtureIdsOf } from '../../core';
import { venueStore } from '../../store/venueStore';
import { VenuePlacementHint } from './VenuePlacementHint';

const meta = { title: 'Venue/VenuePlacementHint', component: VenuePlacementHint, parameters: { game: 'showcase' } } satisfies Meta<typeof VenuePlacementHint>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FixtureSelected: Story = { parameters: { stores: { setup: () => venueStore.getState().selectFixture(fixtureIdsOf('arcade')[0]!) } } };
