import type { Meta, StoryObj } from '@storybook/react-vite';
import { ActionButton } from '../common/ActionButton';
import { Button } from './Button';
import { DialogDemo } from './DialogDemo';

const meta = { title: 'Design/Prototype shadcn-style', parameters: { layout: 'padded' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Buttons: Story = {
  render: () => (
    <div style={{ padding: 24, background: '#2b3a4a', display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: 12, alignItems: 'center', color: 'white' }}>
      <span />
      <strong>Current ActionButton</strong>
      <strong>New Button (cva)</strong>
      <span>default</span><ActionButton>Build</ActionButton><Button>Build</Button>
      <span>primary</span><ActionButton variant="primary">Upgrade</ActionButton><Button variant="primary">Upgrade</Button>
      <span>danger</span><ActionButton variant="danger">Demolish</ActionButton><Button variant="danger">Demolish</Button>
      <span>disabled</span><ActionButton disabled>Build</ActionButton><Button disabled>Build</Button>
      <span>ghost / small</span><span>(none)</span><span style={{ display: 'flex', gap: 8 }}><Button variant="ghost">Cancel</Button><Button size="sm">Small</Button></span>
    </div>
  ),
};

export const RadixDialog: Story = { parameters: { layout: 'fullscreen' }, render: () => <DialogDemo /> };
