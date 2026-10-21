import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tabs, type TabItem } from './Tabs';

type Id = 'friends' | 'groups' | 'profile';

const TABS: TabItem<Id>[] = [
  { id: 'friends', label: 'Friends', count: 3 },
  { id: 'groups', label: 'Groups', count: 12 },
  { id: 'profile', label: 'Profile' },
];

function TabsDemo() {
  const [selected, setSelected] = useState<Id>('friends');
  return <Tabs label="Social" idPrefix="demo-tab" panelId="demo-panel" tabs={TABS} selected={selected} onSelect={setSelected} />;
}

const meta = {
  title: 'Common/Tabs',
  component: TabsDemo,
} satisfies Meta<typeof TabsDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
