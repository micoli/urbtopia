import type { Meta, StoryObj } from '@storybook/react-vite';
import { EmailCodeForm } from './EmailCodeForm';

const meta = {
  title: 'System/EmailCodeForm',
  component: EmailCodeForm,
  args: { state: { kind: 'idle' }, actions: { send: () => {}, verify: () => {}, cancel: () => {} } },
} satisfies Meta<typeof EmailCodeForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {};
export const Sending: Story = { args: { state: { kind: 'sending' } } };
export const InvalidEmail: Story = { args: { state: { kind: 'error', reason: 'invalid-email' } } };
export const RateLimited: Story = { args: { state: { kind: 'error', reason: 'rate-limited' } } };
export const CodeSent: Story = { args: { state: { kind: 'sent', email: 'mayor@example.com' } } };
export const InvalidCode: Story = { args: { state: { kind: 'sent', email: 'mayor@example.com', error: 'invalid-code' } } };
export const Verifying: Story = { args: { state: { kind: 'verifying', email: 'mayor@example.com' } } };
