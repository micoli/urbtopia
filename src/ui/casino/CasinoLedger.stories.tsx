import type { Meta, StoryObj } from '@storybook/react-vite';
import { CasinoLedger } from './CasinoLedger';

const meta = { title: 'Casino/CasinoLedger', component: CasinoLedger, args: { spent: 200, won: 350 } } satisfies Meta<typeof CasinoLedger>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Winning: Story = {};
export const Losing: Story = { args: { spent: 500, won: 80 } };
export const Fresh: Story = { args: { spent: 0, won: 0 } };
