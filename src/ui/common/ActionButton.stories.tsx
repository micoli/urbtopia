import type { Meta, StoryObj } from '@storybook/react-vite';
import { ActionButton } from './ActionButton';

const meta = {
  title: 'Common/ActionButton',
  component: ActionButton,
  args: { children: 'Build' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['default', 'primary', 'danger'] },
    size: { control: 'inline-radio', options: ['md', 'sm', 'xs', 'tile'] },
  },
} satisfies Meta<typeof ActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Primary: Story = { args: { variant: 'primary' } };
export const Danger: Story = { args: { variant: 'danger', children: 'Demolish' } };
export const Block: Story = { args: { block: true }, decorators: [(Story) => <div style={{ width: 240 }}><Story /></div>] };
export const Disabled: Story = { args: { disabled: true } };
export const Small: Story = { args: { size: 'sm' } };
export const ExtraSmall: Story = { args: { size: 'xs' } };
export const Tile: Story = { args: { size: 'tile', variant: 'primary' } };
export const OnOverlay: Story = { args: { overlay: true } };

const VARIANTS = ['default', 'primary', 'danger'] as const;
const SIZES = ['md', 'sm', 'xs', 'tile'] as const;

export const Matrix: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(3, max-content)', gap: 12, alignItems: 'center', padding: 24, borderRadius: 'var(--radius-2xl)', background: 'var(--color-surface-solid)', color: 'var(--color-text)' }}>
      <span />
      {VARIANTS.map((variant) => <strong key={variant}>{variant}</strong>)}
      {SIZES.flatMap((size) => [
        <strong key={size}>{size}</strong>,
        ...VARIANTS.map((variant) => <ActionButton key={`${size}-${variant}`} size={size} variant={variant}>Action</ActionButton>),
      ])}
      <strong>disabled</strong>
      {VARIANTS.map((variant) => <ActionButton key={`disabled-${variant}`} variant={variant} disabled>Action</ActionButton>)}
    </div>
  ),
};
