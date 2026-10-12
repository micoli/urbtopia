import type { Meta, StoryObj } from '@storybook/react-vite';
import { UrbsSymbol } from './UrbsSymbol';

const meta = { title: 'Common/UrbsSymbol', component: UrbsSymbol } satisfies Meta<typeof UrbsSymbol>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
