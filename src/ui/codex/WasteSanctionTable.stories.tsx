import type { Meta, StoryObj } from '@storybook/react-vite';
import { WasteSanctionTable } from './WasteSanctionTable';

const meta = { title: 'Codex/WasteSanctionTable', component: WasteSanctionTable, args: { current: 'medium' } } satisfies Meta<typeof WasteSanctionTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Medium: Story = {};
export const Cozy: Story = { args: { current: 'cozy' } };
export const Hard: Story = { args: { current: 'hard' } };
