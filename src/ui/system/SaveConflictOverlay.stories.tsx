import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CloudActions } from '../../store/cloudStore';
import { SaveConflictOverlay } from './SaveConflictOverlay';

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
};

const meta = { title: 'System/SaveConflictOverlay', component: SaveConflictOverlay, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof SaveConflictOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Conflict: Story = {
  parameters: {
    stores: {
      cloud: {
        enabled: true,
        actions: CLOUD_ACTIONS,
        status: { kind: 'conflict', conflict: { local: { savedAt: 1790000000000, citizens: 1240 }, cloud: { savedAt: 1790000000000 - 86_400_000, citizens: 980, revision: 14 } } },
      },
    },
  },
};
