import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReachToggle } from './ReachToggle';

const meta = { title: 'Common/ReachToggle', component: ReachToggle } satisfies Meta<typeof ReachToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
