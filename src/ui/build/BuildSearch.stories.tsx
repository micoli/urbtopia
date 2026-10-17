import type { Meta, StoryObj } from '@storybook/react-vite';
import { BuildSearch } from './BuildSearch';

const meta = { title: 'Build/BuildSearch', component: BuildSearch, args: { query: '', onChange: () => {} } } satisfies Meta<typeof BuildSearch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Typed: Story = { args: { query: 'silo' } };
