import type { Meta, StoryObj } from '@storybook/react-vite';
import { CurrencyText } from './CurrencyText';

const meta = { title: 'Common/CurrencyText', component: CurrencyText, args: { text: 'Costs 250 {U} per tile' } } satisfies Meta<typeof CurrencyText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const SeveralSymbols: Story = { args: { text: 'Buy for 100 {U}, sell for 60 {U}' } };
export const NoSymbol: Story = { args: { text: 'Free of charge' } };
