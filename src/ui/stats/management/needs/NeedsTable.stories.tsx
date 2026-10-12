import type { Meta, StoryObj } from '@storybook/react-vite';
import { WithGameState } from '../../../../../.storybook/WithGameState';
import { needsPyramid } from '../../../../core';
import { NeedsTable } from './NeedsTable';

const meta = { title: 'Stats/NeedsTable', parameters: { game: 'evolved' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Evolved: Story = { render: () => <WithGameState>{(state) => <NeedsTable levels={needsPyramid(state).levels} onShowSection={() => {}} />}</WithGameState> };
export const PowerShortage: Story = { ...Evolved, parameters: { game: 'powerShortage' } };
