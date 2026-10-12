import type { Meta, StoryObj } from '@storybook/react-vite';
import { CloudAccountSection } from './CloudAccountSection';

const meta = {
  title: 'System/CloudAccountSection',
  component: CloudAccountSection,
  args: { account: null, emailCode: { kind: 'idle' }, codeActions: { send: () => {}, verify: () => {}, cancel: () => {} }, onSignOut: () => {} },
} satisfies Meta<typeof CloudAccountSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedIn: Story = { args: { account: { userId: 'user-1', email: 'mayor@example.com' } } };
export const AnonymousAccount: Story = { args: { account: { userId: 'user-1', email: null } } };
export const CodeSent: Story = { args: { account: { userId: 'user-1', email: null }, emailCode: { kind: 'sent', email: 'mayor@example.com' } } };
