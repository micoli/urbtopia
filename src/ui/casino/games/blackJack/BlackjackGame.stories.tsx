import type { Meta, StoryObj } from '@storybook/react-vite';
import { BuildingOfType } from '../../../../../.storybook/BuildingOfType';
import { BlackjackGame } from './BlackjackGame';

const meta = { title: 'Casino/BlackjackGame', parameters: { game: 'showcase', layout: 'fullscreen' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { render: () => <BuildingOfType type="casino">{(building) => <BlackjackGame casino={building} />}</BuildingOfType> };
