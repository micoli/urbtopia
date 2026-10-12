import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Building } from '../../core';
import { BuildingOfType } from '../../../.storybook/BuildingOfType';
import { CodexLinks } from './CodexLinks';

const meta = { title: 'Buildings/CodexLinks', parameters: { game: 'showcase' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Home: Story = {
  render: () => (
    <BuildingOfType type="home">{(building: Building) => <CodexLinks building={building} />}</BuildingOfType>
  ),
};

export const Workshop: Story = {
  render: () => (
    <BuildingOfType type="workshop">{(building: Building) => <CodexLinks building={building} />}</BuildingOfType>
  ),
};
