import type { Meta, StoryObj } from '@storybook/react-vite';
import { CropEconomyPage } from './CropEconomyPage';

const meta = { title: 'Codex/CropEconomyPage', component: CropEconomyPage, parameters: { game: 'evolved' } } satisfies Meta<typeof CropEconomyPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const StarterCity: Story = { parameters: { game: 'starter' } };
