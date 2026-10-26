import type { Meta, StoryObj } from '@storybook/react-vite';
import { AnalyticsPage } from './AnalyticsPage';

const meta = { title: 'Codex/AnalyticsPage', component: AnalyticsPage } satisfies Meta<typeof AnalyticsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
