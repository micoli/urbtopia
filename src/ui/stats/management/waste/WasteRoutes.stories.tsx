import type { Meta, StoryObj } from '@storybook/react-vite';
import { wasteSituation } from '../../../../core';
import { WithCityStats } from '../../../../../.storybook/WithCityStats';
import { WasteRoutes } from './WasteRoutes';

const meta = { title: 'Stats/WasteRoutes', parameters: { game: 'evolved' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Evolved: Story = { render: () => <WithCityStats>{(s) => <WasteRoutes situation={wasteSituation(s.state)} />}</WithCityStats> };
export const Starter: Story = { ...Evolved, parameters: { game: 'starter' } };
