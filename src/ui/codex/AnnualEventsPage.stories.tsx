import type { Meta, StoryObj } from '@storybook/react-vite';
import { AnnualEventsPage } from './AnnualEventsPage';

const meta = { title: 'Codex/AnnualEventsPage', component: AnnualEventsPage, parameters: { game: 'evolved' } } satisfies Meta<typeof AnnualEventsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
