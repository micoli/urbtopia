import type { Meta, StoryObj } from '@storybook/react-vite';
import { StorageRulesPage } from './StorageRulesPage';

const meta = { title: 'Codex/StorageRulesPage', component: StorageRulesPage } satisfies Meta<typeof StorageRulesPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
