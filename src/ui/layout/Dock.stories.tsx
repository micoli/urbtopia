import type { Meta, StoryObj } from '@storybook/react-vite';
import { Dock } from './Dock';

const meta = { title: 'Layout/Dock', component: Dock, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof Dock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const RichCity: Story = { parameters: { game: 'evolved' } };
