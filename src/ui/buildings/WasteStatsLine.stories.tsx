import type { Meta, StoryObj } from '@storybook/react-vite';
import { WithCityStats } from '../../../.storybook/WithCityStats';
import { WasteStatsLine } from './WasteStatsLine';

const meta = { title: 'Buildings/WasteStatsLine', parameters: { game: 'evolved' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Evolved: Story = { render: () => <WithCityStats>{(s) => <WasteStatsLine state={s.state} />}</WithCityStats> };
