import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Building } from '../../core';
import { BuildingOfType } from '../../../.storybook/BuildingOfType';
import { PirateCovePanel } from './PirateCovePanel';

const meta = { title: 'Buildings/PirateCovePanel', parameters: { game: 'showcase' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const PirateCove: Story = {
  render: () => (
    <BuildingOfType type="pirateCove">{(building: Building) => <PirateCovePanel building={building} />}</BuildingOfType>
  ),
};
