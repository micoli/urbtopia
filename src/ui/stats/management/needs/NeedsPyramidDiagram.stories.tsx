import type { Meta, StoryObj } from '@storybook/react-vite';
import { WithGameState } from '../../../../../.storybook/WithGameState';
import { needsPyramid } from '../../../../core';
import { NeedsPyramidDiagram } from './NeedsPyramidDiagram';

const meta = { title: 'Stats/NeedsPyramidDiagram', parameters: { game: 'evolved' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Evolved: Story = { render: () => <WithGameState>{(state) => <NeedsPyramidDiagram levels={needsPyramid(state).levels} />}</WithGameState> };
export const PowerShortage: Story = { ...Evolved, parameters: { game: 'powerShortage' } };
