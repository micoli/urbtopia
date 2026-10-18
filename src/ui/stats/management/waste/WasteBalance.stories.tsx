import type { Meta, StoryObj } from '@storybook/react-vite';
import { wasteSituation } from '../../../../core';
import { WithCityStats } from '../../../../../.storybook/WithCityStats';
import { WasteBalance } from './WasteBalance';

const meta = { title: 'Stats/WasteBalance', parameters: { game: 'evolved' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Evolved: Story = { render: () => <WithCityStats>{(s) => <WasteBalance situation={wasteSituation(s.state)} />}</WithCityStats> };
export const Starter: Story = { ...Evolved, parameters: { game: 'starter' } };
