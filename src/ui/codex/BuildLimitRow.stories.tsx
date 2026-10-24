import type { Meta, StoryObj } from '@storybook/react-vite';
import { useGame } from '../common/hooks';
import { BuildLimitRow } from './BuildLimitRow';

const meta = {
  title: 'Codex/BuildLimitRow',
  args: { type: 'powerPlant' },
  parameters: { game: 'evolved' },
  render: function Render({ type }) {
    const state = useGame(store => store.state);
    return <BuildLimitRow type={type} state={state} />;
  },
} satisfies Meta<Omit<Parameters<typeof BuildLimitRow>[0], 'state'>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PowerPlant: Story = {};
export const Workshop: Story = { args: { type: 'workshop' } };
