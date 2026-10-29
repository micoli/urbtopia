import type { Meta, StoryObj } from '@storybook/react-vite';
import { SheetContent } from './SheetContent';

const meta = { title: 'Layout/SheetContent', component: SheetContent, parameters: { game: 'showcase' } } satisfies Meta<typeof SheetContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Selection: Story = { parameters: { stores: { selectBuilding: 'home' } } };
export const Build: Story = { parameters: { stores: { ui: { flyout: 'build' } } } };
