import type { Meta, StoryObj } from '@storybook/react-vite';
import { BridgeTools } from './BridgeTools';

const meta = { title: 'Build/BridgeTools', component: BridgeTools, parameters: { game: 'evolved' } } satisfies Meta<typeof BridgeTools>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
