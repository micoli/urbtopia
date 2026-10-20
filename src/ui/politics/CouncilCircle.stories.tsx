import type { Meta, StoryObj } from '@storybook/react-vite';
import { CouncilCircle } from './CouncilCircle';
import { CouncilLegend } from './CouncilLegend';

const meta = { title: 'Politics/CouncilCircle' } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const balanced = { economy: 3, environment: 3, services: 3 };
const shifted = { economy: 5, environment: 3, services: 1 };

export const Balanced: Story = { render: () => <><CouncilCircle seats={balanced} /><CouncilLegend seats={balanced} /></> };
export const AfterAnElection: Story = { render: () => <><CouncilCircle seats={shifted} /><CouncilLegend seats={shifted} /></> };
export const Forecast: Story = {
  render: () => <CouncilCircle seats={balanced} votes={[{ faction: 'economy', seats: 3, vote: 'for' }, { faction: 'environment', seats: 3, vote: 'against' }, { faction: 'services', seats: 3, vote: 'for' }]} />,
};
