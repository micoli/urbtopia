import type { Meta, StoryObj } from '@storybook/react-vite';
import { RecurringCostsPage } from './RecurringCostsPage';

const meta = { title: 'Codex/RecurringCostsPage', component: RecurringCostsPage } satisfies Meta<typeof RecurringCostsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
