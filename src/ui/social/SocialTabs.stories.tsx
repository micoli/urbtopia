import type { Meta, StoryObj } from '@storybook/react-vite';
import { SocialTabs } from './SocialTabs';

const meta = { title: 'Social/SocialTabs', component: SocialTabs, args: { tab: 'friends', friendsPending: 0, exchangesPending: 0, onSelect: () => {} } } satisfies Meta<typeof SocialTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Friends: Story = {};
export const Exchanges: Story = { args: { tab: 'exchanges' } };
export const WithPending: Story = { args: { friendsPending: 2, exchangesPending: 12 } };
