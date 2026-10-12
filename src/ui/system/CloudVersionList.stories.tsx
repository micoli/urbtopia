import type { Meta, StoryObj } from '@storybook/react-vite';
import { CloudVersionList } from './CloudVersionList';

const HOUR = 3_600_000;

const meta = {
  title: 'System/CloudVersionList',
  component: CloudVersionList,
  args: {
    versions: [
      { revision: 12, clientSavedAt: 1790000000000, createdAt: 1790000000000 },
      { revision: 11, clientSavedAt: 1790000000000 - HOUR, createdAt: 1790000000000 - HOUR },
      { revision: 10, clientSavedAt: 1790000000000 - 26 * HOUR, createdAt: 1790000000000 - 26 * HOUR },
    ],
    onRestore: () => {},
  },
} satisfies Meta<typeof CloudVersionList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Single: Story = { args: { versions: [{ revision: 1, clientSavedAt: 1790000000000, createdAt: 1790000000000 }] } };
