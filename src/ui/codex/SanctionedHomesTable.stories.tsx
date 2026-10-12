import type { Meta, StoryObj } from '@storybook/react-vite';
import { WithGameState } from '../../../.storybook/WithGameState';
import { sanctionedHomes } from '../../core';
import { SanctionedHomesTable } from './SanctionedHomesTable';

const meta = { title: 'Codex/SanctionedHomesTable', parameters: { game: 'powerShortage' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { render: () => <WithGameState>{(state) => <SanctionedHomesTable homes={sanctionedHomes(state)} />}</WithGameState> };
