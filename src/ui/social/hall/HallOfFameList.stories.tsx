import type { Meta, StoryObj } from '@storybook/react-vite';
import { HallOfFameList } from './HallOfFameList';

const entries = [
  { rank: 1, userId: 'u1', handle: 'Skyline', avatar: 'character-female-c', citizens: 18400 },
  { rank: 2, userId: 'u2', handle: 'MayorStory', avatar: 'character-male-c', citizens: 12150 },
  { rank: 3, userId: 'u3', handle: 'Harbour', avatar: null, citizens: 9020 },
];

const meta = {
  title: 'Social/HallOfFameList',
  component: HallOfFameList,
  args: { state: 'ready', entries, visitBusy: false, visitFailure: null, onVisit: () => {}, onRefresh: () => {} },
} satisfies Meta<typeof HallOfFameList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = { args: { entries: [] } };
export const Offline: Story = { args: { state: 'offline', entries: [] } };
export const VisitFailed: Story = { args: { visitFailure: 'not-found' } };
