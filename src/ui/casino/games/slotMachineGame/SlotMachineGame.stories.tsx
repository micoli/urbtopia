import type { Meta, StoryObj } from '@storybook/react-vite';
import { BuildingOfType } from '../../../../../.storybook/BuildingOfType';
import { SlotMachineGame } from './SlotMachineGame';

const meta = { title: 'Casino/SlotMachineGame', parameters: { game: 'showcase', layout: 'fullscreen' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { render: () => <BuildingOfType type="casino">{(building) => <SlotMachineGame casino={building} />}</BuildingOfType> };
