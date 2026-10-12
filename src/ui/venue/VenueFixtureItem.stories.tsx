import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtureIdsOf } from '../../core';
import { VenueFixtureItem } from './VenueFixtureItem';

const [firstArcadeFixture] = fixtureIdsOf('arcade');

const meta = {
  title: 'Venue/VenueFixtureItem',
  component: VenueFixtureItem,
  args: { id: firstArcadeFixture!, tier: 3, rank: 3, selected: false, onChoose: () => {} },
} satisfies Meta<typeof VenueFixtureItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Available: Story = {};
export const Selected: Story = { args: { selected: true } };
export const LockedByTier: Story = { args: { tier: 1, rank: 1 } };
