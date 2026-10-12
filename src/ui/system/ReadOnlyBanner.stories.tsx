import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReadOnlyBanner } from './ReadOnlyBanner';

const meta = { title: 'System/ReadOnlyBanner', component: ReadOnlyBanner, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof ReadOnlyBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ReadOnly: Story = { parameters: { stores: { readOnly: true } } };
