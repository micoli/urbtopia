import type { Meta, StoryObj } from '@storybook/react-vite';
import { SectionNavigation } from './SectionNavigation';

const meta = { title: 'Stats/SectionNavigation', component: SectionNavigation, args: { onSelect: () => {} } } satisfies Meta<typeof SectionNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
