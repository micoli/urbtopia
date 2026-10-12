import type { Meta, StoryObj } from '@storybook/react-vite';
import { WithCityStats } from '../../../../../.storybook/WithCityStats';
import { TransitTabs } from './TransitTabs';

const meta = { title: 'Stats/TransitTabs', parameters: { game: 'evolved' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Evolved: Story = { render: () => <WithCityStats>{(s) => <TransitTabs transport={s.transport} />}</WithCityStats> };
