import type { Meta, StoryObj } from '@storybook/react-vite';
import { WasteCodexLink } from './WasteCodexLink';

const meta = { title: 'Stats/WasteCodexLink', component: WasteCodexLink } satisfies Meta<typeof WasteCodexLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
