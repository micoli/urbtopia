import type { Meta, StoryObj } from '@storybook/react-vite';
import { DialogDemo } from './DialogDemo';

const meta = { title: 'Design/Prototype shadcn-style', parameters: { layout: 'padded' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const RadixDialog: Story = { parameters: { layout: 'fullscreen' }, render: () => <DialogDemo /> };
