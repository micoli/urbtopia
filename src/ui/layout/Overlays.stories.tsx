import type { Meta, StoryObj } from '@storybook/react-vite';
import { Overlays } from './Overlays';

const meta = { title: 'Layout/Overlays', component: Overlays, parameters: { layout: 'fullscreen', game: 'evolved' } } satisfies Meta<typeof Overlays>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
