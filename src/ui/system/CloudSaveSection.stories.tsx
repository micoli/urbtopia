import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CloudActions } from '../../store/cloudStore';
import { CloudSaveSection } from './CloudSaveSection';

const resolved = () => Promise.resolve();
const CLOUD_ACTIONS: CloudActions = {
  sendEmailCode: resolved,
  verifyEmailCode: resolved,
  cancelEmailCode: () => {},
  signOut: resolved,
  syncNow: resolved,
  resolveConflict: resolved,
  loadVersions: resolved,
  restoreVersion: resolved,
  deleteCloudData: resolved,
  deleteCity: async () => true,
};

const meta = { title: 'System/CloudSaveSection', component: CloudSaveSection } satisfies Meta<typeof CloudSaveSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedIn: Story = { parameters: { stores: { cloud: { enabled: true, status: { kind: 'synced', at: 1790000000000 }, account: { userId: 'user-1', email: 'mayor@example.com' }, actions: CLOUD_ACTIONS } } } };
export const SignedOut: Story = { parameters: { stores: { cloud: { enabled: true, status: { kind: 'idle' }, actions: CLOUD_ACTIONS } } } };
