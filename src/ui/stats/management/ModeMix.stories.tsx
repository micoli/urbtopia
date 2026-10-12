import type { Meta, StoryObj } from '@storybook/react-vite';
import { WithCityStats } from '../../../../.storybook/WithCityStats';
import { ModeMix } from './ModeMix';

const meta = { title: 'Stats/ModeMix', parameters: { game: 'evolved' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Evolved: Story = { render: () => <WithCityStats>{(s) => <ModeMix congestion={s.congestion} />}</WithCityStats> };
export const Starter: Story = { ...Evolved, parameters: { game: 'starter' } };
