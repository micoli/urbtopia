import type { Meta, StoryObj } from '@storybook/react-vite';
import { WithCityStats } from '../../../../.storybook/WithCityStats';
import { coolingElements, heatSourceItems, isAdapting, temperatureBreakdown } from '../../../core';
import { TemperatureSection } from './TemperatureSection';

const meta = { title: 'Stats/TemperatureSection', parameters: { game: 'evolved' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Evolved: Story = {
  render: () => <WithCityStats>{(s) => <TemperatureSection elements={coolingElements(s.state)} items={heatSourceItems(s.state, { climate: s.climate, energy: s.energy, transport: s.transport, cooling: s.green.cooling })} breakdown={temperatureBreakdown({ climate: s.climate, energy: s.energy, transport: s.transport, cooling: s.green.cooling, adapting: isAdapting(s.state) })} />}</WithCityStats>,
};
export const Starter: Story = { ...Evolved, parameters: { game: 'starter' } };
