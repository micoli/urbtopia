import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProductionChainsPage } from './ProductionChainsPage';

const meta = { title: 'Codex/ProductionChainsPage', component: ProductionChainsPage } satisfies Meta<typeof ProductionChainsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
