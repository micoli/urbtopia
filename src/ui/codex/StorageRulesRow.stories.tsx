import type { Meta, StoryObj } from '@storybook/react-vite';
import { StorageRulesRow } from './StorageRulesRow';

const meta = { title: 'Codex/StorageRulesRow', component: StorageRulesRow, args: { type: 'storehouse' } } satisfies Meta<typeof StorageRulesRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Storehouse: Story = {};
export const GrainSilo: Story = { args: { type: 'grainSilo' } };
export const MaterialDepot: Story = { args: { type: 'materialDepot' } };
export const Vault: Story = { args: { type: 'vault' } };
