import type { Meta, StoryObj } from '@storybook/react-vite';
import { CloudStatusLine } from './CloudStatusLine';

const meta = { title: 'System/CloudStatusLine', component: CloudStatusLine } satisfies Meta<typeof CloudStatusLine>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = { args: { status: { kind: 'idle' } } };
export const Syncing: Story = { args: { status: { kind: 'syncing' } } };
export const Pending: Story = { args: { status: { kind: 'pending' } } };
export const Synced: Story = { args: { status: { kind: 'synced', at: 1790000000000 } } };
export const Offline: Story = { args: { status: { kind: 'offline' } } };
export const NewerVersion: Story = { args: { status: { kind: 'error', reason: 'newer-version' } } };
export const TooLarge: Story = { args: { status: { kind: 'error', reason: 'too-large' } } };
export const Unauthenticated: Story = { args: { status: { kind: 'error', reason: 'unauthenticated' } } };
