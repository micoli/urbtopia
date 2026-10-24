import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Building } from '../../core';
import { BuildingOfType } from '../../../.storybook/BuildingOfType';
import { FacilityPanel } from './FacilityPanel';

const meta = { title: 'Buildings/FacilityPanel', parameters: { game: 'showcase' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const School: Story = {
  render: () => (
    <BuildingOfType type="school">{(building: Building) => <FacilityPanel building={building as Parameters<typeof FacilityPanel>[0]['building']} />}</BuildingOfType>
  ),
};

export const Hospital: Story = {
  render: () => (
    <BuildingOfType type="hospital">{(building: Building) => <FacilityPanel building={building as Parameters<typeof FacilityPanel>[0]['building']} />}</BuildingOfType>
  ),
};

export const FireStation: Story = {
  render: () => (
    <BuildingOfType type="fireStation">{(building: Building) => <FacilityPanel building={building as Parameters<typeof FacilityPanel>[0]['building']} />}</BuildingOfType>
  ),
};

export const RecyclingPlant: Story = {
  render: () => (
    <BuildingOfType type="recyclingPlant">{(building: Building) => <FacilityPanel building={building as Parameters<typeof FacilityPanel>[0]['building']} />}</BuildingOfType>
  ),
};
