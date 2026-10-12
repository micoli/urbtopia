import type { Meta, StoryObj } from '@storybook/react-vite';
import { WithCityStats } from '../../../../.storybook/WithCityStats';
import { NatureSection } from './NatureSection';

const meta = { title: 'Stats/NatureSection', parameters: { game: 'evolved' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Evolved: Story = { render: () => <WithCityStats>{(s) => <NatureSection state={s.state} green={s.green} />}</WithCityStats> };
export const Starter: Story = { ...Evolved, parameters: { game: 'starter' } };
