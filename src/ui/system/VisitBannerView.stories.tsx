import type { Meta, StoryObj } from '@storybook/react-vite';
import { VisitBannerView } from './VisitBannerView';

const meta = { title: 'System/VisitBanner', component: VisitBannerView, parameters: { layout: 'fullscreen' }, args: { handle: 'MayorStory', cityName: 'Story Heights', onLeave: () => {} } } satisfies Meta<typeof VisitBannerView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
