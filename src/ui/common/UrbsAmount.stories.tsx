import type { Meta, StoryObj } from '@storybook/react-vite';
import { UrbsAmount } from './UrbsAmount';

const meta = { title: 'Common/UrbsAmount', component: UrbsAmount, args: { value: 1250 } } satisfies Meta<typeof UrbsAmount>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Fractional: Story = { args: { value: 12.7 } };
