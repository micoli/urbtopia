import type { Meta, StoryObj } from '@storybook/react-vite';
import { SOCIAL_ACTIONS, SOCIAL_PROFILE } from '../../../.storybook/socialFixtures';
import type { CloudActions } from '../../store/cloudStore';
import { SocialWindow } from './SocialWindow';

const meta = { title: 'Social/SocialWindow', component: SocialWindow, parameters: { layout: 'fullscreen', game: 'evolved' } } satisfies Meta<typeof SocialWindow>;

export default meta;
type Story = StoryObj<typeof meta>;

const SIGNED_IN = { enabled: true, status: { kind: 'idle' as const }, account: { userId: 'me', email: 'mayor@example.com' }, actions: {} as CloudActions };
const READY = { enabled: true, status: 'ready' as const, profile: SOCIAL_PROFILE, actions: SOCIAL_ACTIONS };

export const Friends: Story = { parameters: { stores: { ui: { socialOpen: true, socialTab: 'friends' }, cloud: SIGNED_IN, social: READY } } };
export const Exchanges: Story = { parameters: { stores: { ui: { socialOpen: true, socialTab: 'exchanges' }, cloud: SIGNED_IN, social: READY } } };
export const SignedOut: Story = { parameters: { stores: { ui: { socialOpen: true } } } };
export const NoHandle: Story = { parameters: { stores: { ui: { socialOpen: true }, cloud: SIGNED_IN, social: { enabled: true, status: 'no-handle', actions: SOCIAL_ACTIONS } } } };
