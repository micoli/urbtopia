import type { Meta, StoryObj } from '@storybook/react-vite';
import { MarketTabs } from './MarketTabs';

const meta = { title: 'Market/MarketTabs', component: MarketTabs, args: { onSelect: () => {} } } satisfies Meta<typeof MarketTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Market: Story = { args: { tab: 'market', eventsPending: 0 } };
export const Events: Story = { args: { tab: 'events', eventsPending: 0 } };
export const NewChallenges: Story = { args: { tab: 'market', eventsPending: 3 } };
