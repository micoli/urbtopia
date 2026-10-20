import type { Meta, StoryObj } from '@storybook/react-vite';
import { PoliticsWindow } from './PoliticsWindow';

const meta = { title: 'Politics/PoliticsWindow', parameters: { game: 'political', stores: { ui: { politicsOpen: true } } } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Medium: Story = { render: () => <PoliticsWindow /> };
export const French: Story = { ...Medium, parameters: { game: 'political', stores: { ui: { politicsOpen: true }, prefs: { language: 'fr' } } } };
export const Cozy: Story = { ...Medium, parameters: { game: 'starter', stores: { ui: { politicsOpen: true } } } };
