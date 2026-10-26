import type { Meta, StoryObj } from '@storybook/react-vite';
import { AnalyticsLegend } from './AnalyticsLegend';

const meta = { title: 'Analytics/AnalyticsLegend', component: AnalyticsLegend } satisfies Meta<typeof AnalyticsLegend>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Heat: Story = { args: { legend: { ramp: 'heat', max: 20 } } };
