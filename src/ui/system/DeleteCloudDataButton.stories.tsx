import type { Meta, StoryObj } from '@storybook/react-vite';
import { DeleteCloudDataButton } from './DeleteCloudDataButton';

const meta = { title: 'System/DeleteCloudDataButton', component: DeleteCloudDataButton, args: { onDelete: () => {} } } satisfies Meta<typeof DeleteCloudDataButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
