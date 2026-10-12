import type { Meta, StoryObj } from '@storybook/react-vite';
import { ActionButton } from './ActionButton';
import { Dialog } from './Dialog';

const meta = {
  title: 'Common/Dialog',
  component: Dialog,
  parameters: { layout: 'fullscreen' },
  args: {
    children: [
      <Dialog.Title key="title">Demolish this building?</Dialog.Title>,
      <Dialog.Body key="body"><p>The building and its contents are lost.</p></Dialog.Body>,
      <Dialog.Actions key="actions">
        <ActionButton>Cancel</ActionButton>
        <ActionButton variant="danger">Demolish</ActionButton>
      </Dialog.Actions>,
    ],
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const AlertDialog: Story = { args: { role: 'alertdialog' } };

export const ColumnActions: Story = {
  args: {
    children: [
      <Dialog.Title key="title">Save conflict</Dialog.Title>,
      <Dialog.Body key="body"><p>The local city and the Cloud save diverged.</p></Dialog.Body>,
      <Dialog.Actions key="actions" column>
        <ActionButton variant="primary">Keep local</ActionButton>
        <ActionButton>Keep Cloud</ActionButton>
      </Dialog.Actions>,
    ],
  },
};
