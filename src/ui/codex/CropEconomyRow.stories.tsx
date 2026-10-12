import type { Meta, StoryObj } from '@storybook/react-vite';
import { CropEconomyRow } from './CropEconomyRow';

const meta = { title: 'Codex/CropEconomyRow', component: CropEconomyRow, args: { crop: 'wheat', tiles: 4, unlocked: true } } satisfies Meta<typeof CropEconomyRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unlocked: Story = {};
export const Locked: Story = { args: { unlocked: false } };
