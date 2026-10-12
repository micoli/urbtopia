import type { Meta, StoryObj } from '@storybook/react-vite';
import { WithCityStats } from '../../../../.storybook/WithCityStats';
import { WellbeingSection } from './WellbeingSection';

const meta = { title: 'Stats/WellbeingSection', parameters: { game: 'evolved' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Evolved: Story = { render: () => <WithCityStats>{(s) => <WellbeingSection green={s.green} />}</WithCityStats> };
export const Starter: Story = { ...Evolved, parameters: { game: 'starter' } };
