import type { Meta, StoryObj } from '@storybook/react-vite';
import { WithCityStats } from '../../../../../.storybook/WithCityStats';
import { TransitLines } from './TransitLines';

const meta = { title: 'Stats/TransitLines', parameters: { game: 'evolved' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Evolved: Story = { render: () => <WithCityStats>{(s) => <TransitLines transport={s.transport} />}</WithCityStats> };
