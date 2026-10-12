import type { Meta, StoryObj } from '@storybook/react-vite';
import { uiStore } from '../../store/uiStore';
import { CodexPanel } from './CodexPanel';

const meta = { title: 'Codex/CodexPanel', component: CodexPanel, parameters: { layout: 'fullscreen', game: 'evolved' } } satisfies Meta<typeof CodexPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { parameters: { stores: { setup: () => uiStore.getState().openCodex() } } };
export const Building: Story = { parameters: { stores: { setup: () => uiStore.getState().openCodex('workshop') } } };
export const Crop: Story = { parameters: { stores: { setup: () => uiStore.getState().openCodex('wheat') } } };
export const EnergyPage: Story = { parameters: { stores: { setup: () => uiStore.getState().openCodex(undefined, 'energy') } } };
