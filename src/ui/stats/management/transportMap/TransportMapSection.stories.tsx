import type { Meta, StoryObj } from '@storybook/react-vite';
import { WithCityStats } from '../../../../../.storybook/WithCityStats';
import { TransportMapSection } from './TransportMapSection';

const meta = { title: 'Stats/TransportMapSection', parameters: { game: 'loopLine' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const LoopLine: Story = { render: () => <WithCityStats>{(s) => <TransportMapSection state={s.state} transport={s.transport} congestion={s.congestion} />}</WithCityStats> };
export const NoLine: Story = { ...LoopLine, parameters: { game: 'starter' } };
