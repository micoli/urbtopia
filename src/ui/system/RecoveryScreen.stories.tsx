import type { Meta, StoryObj } from '@storybook/react-vite';
import { RecoveryScreen } from './RecoveryScreen';

const meta = { title: 'System/RecoveryScreen', component: RecoveryScreen, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof RecoveryScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InvalidJson: Story = { parameters: { stores: { dialog: { recovery: { reason: 'invalid-json', raw: '{"broken' } } } } };
export const NewerVersion: Story = { parameters: { stores: { dialog: { recovery: { reason: 'newer-version', raw: '{}' } } } } };
export const InvalidState: Story = { parameters: { stores: { dialog: { recovery: { reason: 'invalid-state', raw: '{}' } } } } };
