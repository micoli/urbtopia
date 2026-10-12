import type { Meta, StoryObj } from '@storybook/react-vite';
import { WithCityStats } from '../../../../../.storybook/WithCityStats';
import { NetworkStatus } from './NetworkStatus';

const meta = { title: 'Stats/NetworkStatus', parameters: { game: 'evolved' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Evolved: Story = { render: () => <WithCityStats>{(s) => <NetworkStatus transport={s.transport} />}</WithCityStats> };
