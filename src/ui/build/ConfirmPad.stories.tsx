import type { Meta, StoryObj } from '@storybook/react-vite';
import { uiStore } from '../../store/uiStore';
import { ConfirmPad } from './ConfirmPad';

const meta = { title: 'Build/ConfirmPad', component: ConfirmPad, parameters: { game: 'evolved' } } satisfies Meta<typeof ConfirmPad>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Building: Story = { parameters: { stores: { setup: () => uiStore.getState().chooseTool({ kind: 'building', buildingType: 'home' }) } } };
