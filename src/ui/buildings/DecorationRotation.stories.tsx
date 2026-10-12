import type { Meta, StoryObj } from '@storybook/react-vite';
import { natureModelOf } from '../../core';
import { useGame } from '../common/hooks';
import { DecorationRotation } from './DecorationRotation';

function FirstDecoration() {
  const decoration = useGame((store) => store.state.buildings.find((building) => natureModelOf(building.type)?.[2] === 'decoration'));
  if (!decoration) throw new Error('The game fixture has no decoration');
  return <DecorationRotation building={decoration} />;
}

const meta = { title: 'Buildings/DecorationRotation', component: FirstDecoration, parameters: { game: 'showcase' } } satisfies Meta<typeof FirstDecoration>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
