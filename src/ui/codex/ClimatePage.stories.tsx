import type { Meta, StoryObj } from '@storybook/react-vite';
import { ClimatePage } from './ClimatePage';

const meta = { title: 'Codex/ClimatePage', component: ClimatePage, parameters: { game: 'evolved' } } satisfies Meta<typeof ClimatePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
