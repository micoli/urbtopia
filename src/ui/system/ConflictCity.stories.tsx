import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConflictCity } from './ConflictCity';

const meta = {
  title: 'System/ConflictCity',
  component: ConflictCity,
  args: { title: 'This device', city: { savedAt: 1790000000000, citizens: 1240 }, keepLabel: 'Keep this city', onKeep: () => {} },
} satisfies Meta<typeof ConflictCity>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
