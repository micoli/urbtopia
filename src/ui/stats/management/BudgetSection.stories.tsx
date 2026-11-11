import type { Meta, StoryObj } from '@storybook/react-vite';
import { WithCityStats } from '../../../../.storybook/WithCityStats';
import { BudgetSection } from './BudgetSection';

const meta = { title: 'Stats/BudgetSection', parameters: { game: 'evolved' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Evolved: Story = { render: () => <WithCityStats>{(s) => <BudgetSection state={s.state} energy={s.energy} transport={s.transport} congestion={s.congestion} />}</WithCityStats> };
