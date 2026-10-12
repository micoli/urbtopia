import type { Meta, StoryObj } from '@storybook/react-vite';
import { PanelHeader } from './PanelHeader';

const meta = { title: 'Common/PanelHeader', component: PanelHeader, args: { title: 'Home', subtitle: 'Level 3', onClose: () => {} } } satisfies Meta<typeof PanelHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithoutSubtitle: Story = { args: { subtitle: undefined } };
