import type { Meta, StoryObj } from '@storybook/react-vite';
import { SwitchField } from './SwitchField';

const meta = { title: 'Common/SwitchField', component: SwitchField, args: { label: 'Traffic', checked: true, onChange: () => {} } } satisfies Meta<typeof SwitchField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const On: Story = {};
export const Off: Story = { args: { checked: false } };
export const WithDescription: Story = { args: { description: 'Shows the vehicles on the roads.' } };
