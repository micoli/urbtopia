import type { Meta, StoryObj } from '@storybook/react-vite';
import { uiStore } from '../../store/uiStore';
import { CodexDialog } from './CodexDialog';

const meta = { title: 'Codex/CodexDialog', component: CodexDialog, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof CodexDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = { parameters: { stores: { setup: () => uiStore.getState().openCodex('home') } } };
