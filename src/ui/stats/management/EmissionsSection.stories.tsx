import type { Meta, StoryObj } from '@storybook/react-vite';
import { WithCityStats } from '../../../../.storybook/WithCityStats';
import { EmissionsSection } from './EmissionsSection';

const meta = { title: 'Stats/EmissionsSection', parameters: { game: 'evolved' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Evolved: Story = { render: () => <WithCityStats>{(s) => <EmissionsSection climate={s.climate} energy={s.energy} transport={s.transport} />}</WithCityStats> };
export const Starter: Story = { ...Evolved, parameters: { game: 'starter' } };
