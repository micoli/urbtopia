import type { Meta, StoryObj } from '@storybook/react-vite';
import { BUILDING_SECTIONS } from './buildMenuSections';
import { NextBuildingUnlock } from './NextBuildingUnlock';

const meta = { title: 'Build/NextBuildingUnlock', component: NextBuildingUnlock, args: { candidates: BUILDING_SECTIONS.flatMap(section => section.types) } } satisfies Meta<typeof NextBuildingUnlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
