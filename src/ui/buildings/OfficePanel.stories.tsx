import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Building } from '../../core';
import { BuildingOfType } from '../../../.storybook/BuildingOfType';
import { OfficePanel } from './OfficePanel';

const meta = { title: 'Buildings/OfficePanel', parameters: { game: 'showcase' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Office: Story = {
  render: () => (
    <BuildingOfType type="office">{(building: Building) => <OfficePanel building={building} />}</BuildingOfType>
  ),
};
