import type { Meta, StoryObj } from '@storybook/react-vite';
import { wasteSituation } from '../../../../core';
import { WithCityStats } from '../../../../../.storybook/WithCityStats';
import { WasteFamilies } from './WasteFamilies';

const meta = { title: 'Stats/WasteFamilies', parameters: { game: 'evolved' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Evolved: Story = { render: () => <WithCityStats>{(s) => <WasteFamilies families={wasteSituation(s.state).families} />}</WithCityStats> };
export const Starter: Story = { ...Evolved, parameters: { game: 'starter' } };
