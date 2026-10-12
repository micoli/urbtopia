import type { Meta, StoryObj } from '@storybook/react-vite';
import { WithGameState } from '../../../.storybook/WithGameState';
import { EnergyForecastChart } from './EnergyForecastChart';

const meta = { title: 'Codex/EnergyForecastChart', parameters: { game: 'evolved' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Evolved: Story = { render: () => <WithGameState>{(state) => <EnergyForecastChart state={state} />}</WithGameState> };
export const Starter: Story = { ...Evolved, parameters: { game: 'starter' } };
