import type { Meta, StoryObj } from '@storybook/react-vite';
import { SlowedLines } from './SlowedLines';

const meta = { title: 'Stats/SlowedLines', component: SlowedLines, args: { count: 3 } } satisfies Meta<typeof SlowedLines>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
