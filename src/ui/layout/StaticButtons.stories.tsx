import type { Meta, StoryObj } from '@storybook/react-vite';
import { StaticButtons } from './StaticButtons';

const meta = { title: 'Layout/StaticButtons', component: StaticButtons, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof StaticButtons>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
