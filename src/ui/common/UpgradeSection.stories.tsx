import type { Meta, StoryObj } from '@storybook/react-vite';
import { maxTierOf } from '../../core';
import { useGame } from './hooks';
import { UpgradeSection } from './UpgradeSection';

function FirstUpgradeableBuilding() {
  const building = useGame((store) => store.state.buildings.find((candidate) => candidate.tier < maxTierOf(candidate.type)));
  return building ? <UpgradeSection building={building} /> : null;
}

const meta = { title: 'Common/UpgradeSection', component: FirstUpgradeableBuilding } satisfies Meta<typeof FirstUpgradeableBuilding>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Affordable: Story = { parameters: { game: 'evolved' } };
export const MissingFunds: Story = { parameters: { game: 'brokeEvolved' } };
