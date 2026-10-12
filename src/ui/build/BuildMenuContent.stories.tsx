import type { Meta, StoryObj } from '@storybook/react-vite';
import { BuildMenuContent } from './BuildMenuContent';

const meta = { title: 'Build/BuildMenuContent', component: BuildMenuContent, parameters: { game: 'evolved' } } satisfies Meta<typeof BuildMenuContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Build: Story = { parameters: { stores: { ui: { flyout: 'build' } } } };
export const Roads: Story = { parameters: { stores: { ui: { flyout: 'roads' } } } };
export const BuildOnStarterCity: Story = { parameters: { game: 'starter', stores: { ui: { flyout: 'build' } } } };
