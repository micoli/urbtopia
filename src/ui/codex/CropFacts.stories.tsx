import type { Meta, StoryObj } from '@storybook/react-vite';
import { CROP_IDS } from '../../core';
import { CropFacts } from './CropFacts';

const meta = { title: 'Codex/CropFacts', component: CropFacts, args: { crop: CROP_IDS[0] } } satisfies Meta<typeof CropFacts>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstCrop: Story = {};
export const LastCrop: Story = { args: { crop: CROP_IDS[CROP_IDS.length - 1] } };
