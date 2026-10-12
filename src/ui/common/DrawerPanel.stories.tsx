import type { Meta, StoryObj } from '@storybook/react-vite';
import { DrawerPanel } from './DrawerPanel';

const meta = { title: 'Common/DrawerPanel', component: DrawerPanel } satisfies Meta<typeof DrawerPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <DrawerPanel>
      <DrawerPanel.Title title="Workshop" level={3} />
      <DrawerPanel.LabelValue label="Output" value="12 / h" />
      <DrawerPanel.LabelValue label="Power" value="Missing" tone="warn" />
    </DrawerPanel>
  ),
};
