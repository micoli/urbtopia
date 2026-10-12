import type { Meta, StoryObj } from '@storybook/react-vite';
import { CloudSavePanel } from './CloudSavePanel';

const noop = () => {};

const meta = {
  title: 'System/CloudSavePanel',
  component: CloudSavePanel,
  args: {
    status: { kind: 'synced', at: 1790000000000 },
    versions: null,
    account: { userId: 'user-1', email: 'mayor@example.com' },
    emailCode: { kind: 'idle' },
    onSaveNow: noop,
    onShowVersions: noop,
    onRestore: noop,
    onDelete: noop,
    codeActions: { send: noop, verify: noop, cancel: noop },
    onSignOut: noop,
  },
} satisfies Meta<typeof CloudSavePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Synced: Story = {};
export const Syncing: Story = { args: { status: { kind: 'syncing' } } };
export const Offline: Story = { args: { status: { kind: 'offline' } } };
export const SignedOut: Story = { args: { account: null, status: { kind: 'idle' } } };
export const WithVersions: Story = {
  args: { versions: [{ revision: 12, clientSavedAt: 1790000000000, createdAt: 1790000000000 }, { revision: 11, clientSavedAt: 1790000000000 - 3_600_000, createdAt: 1790000000000 - 3_600_000 }] },
};
