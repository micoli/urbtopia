import type { Meta, StoryObj } from '@storybook/react-vite';
import { WithCityStats } from '../../../../../.storybook/WithCityStats';
import { FleetTable } from './FleetTable';

const meta = { title: 'Stats/FleetTable', parameters: { game: 'evolved' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Evolved: Story = { render: () => <WithCityStats>{(s) => <FleetTable state={s.state} transport={s.transport} />}</WithCityStats> };
