import type { Meta, StoryObj } from '@storybook/react-vite';
import { BuildingOfType } from '../../../../../.storybook/BuildingOfType';
import { BlockmatchGame } from './BlockmatchGame';

const meta = { title: 'Casino/BlockmatchGame', parameters: { game: 'showcase', layout: 'fullscreen' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { render: () => <BuildingOfType type="casino">{(building) => <BlockmatchGame casino={building} />}</BuildingOfType> };
