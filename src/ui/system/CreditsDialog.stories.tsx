import type { Meta, StoryObj } from '@storybook/react-vite';
import { CreditsDialog } from './CreditsDialog';

const meta = { title: 'System/CreditsDialog', component: CreditsDialog, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof CreditsDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = { parameters: { stores: { dialog: { creditsOpen: true } } } };
