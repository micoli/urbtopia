import type { Meta, StoryObj } from '@storybook/react-vite';
import { FieldTools } from './FieldTools';

const meta = { title: 'Build/FieldTools', component: FieldTools, parameters: { game: 'showcase' } } satisfies Meta<typeof FieldTools>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
