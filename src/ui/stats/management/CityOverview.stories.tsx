import type { Meta, StoryObj } from '@storybook/react-vite';
import { WithCityStats } from '../../../../.storybook/WithCityStats';
import { CityOverview } from './CityOverview';

const meta = { title: 'Stats/CityOverview', parameters: { game: 'evolved' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Evolved: Story = { render: () => <WithCityStats>{(s) => <CityOverview state={s.state} energy={s.energy} green={s.green} climate={s.climate} transport={s.transport} congestion={s.congestion} onShowTransport={() => {}} onShowTraffic={() => {}} onShowNeeds={() => {}} onShowTemperature={() => {}} />}</WithCityStats> };
export const Starter: Story = { ...Evolved, parameters: { game: 'starter' } };
