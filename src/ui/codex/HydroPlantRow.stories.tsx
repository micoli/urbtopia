import type { Meta, StoryObj } from '@storybook/react-vite';
import { BuildingOfType } from '../../../.storybook/BuildingOfType';
import { WithGameState } from '../../../.storybook/WithGameState';
import { HydroPlantRow } from './HydroPlantRow';

const meta = { title: 'Codex/HydroPlantRow', parameters: { game: 'showcase' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <WithGameState>{(state) => <BuildingOfType type="hydroPlant">{(plant) => <HydroPlantRow state={state} plant={plant} />}</BuildingOfType>}</WithGameState>
  ),
};
