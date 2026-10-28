import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from './cn';
import './tailwind.css';

// `action-button` stays as a hook for the structural selectors of the legacy CSS (button rows, casino tiles).
const actionButton = cva(
  'action-button rounded-ui-lg border-0 bg-ui-muted px-3 py-0 text-inherit [font-family:inherit] [font-size:inherit] [line-height:inherit] cursor-pointer disabled:cursor-not-allowed disabled:opacity-45 aria-disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default: '[font-weight:inherit]',
        primary: 'bg-ui-accent font-bold text-ui-on-accent disabled:bg-ui-muted disabled:text-inherit',
        danger: 'bg-ui-danger text-ui-on-danger [font-weight:inherit]',
      },
      size: {
        md: 'min-h-[var(--tap)]',
        sm: 'min-h-10',
        xs: 'min-h-9 rounded-ui-md',
        tile: 'flex min-h-14 items-center gap-3 text-left',
      },
      block: { true: 'mt-2 w-full', false: '' },
      overlay: { true: 'bg-ui-muted-hover', false: '' },
    },
    defaultVariants: { variant: 'default', size: 'md', block: false, overlay: false },
  },
);

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof actionButton> {}

export function ActionButton({ variant, size, block, overlay, className, type = 'button', ...rest }: ActionButtonProps) {
  return <button type={type} className={cn(actionButton({ variant, size, block, overlay }), className)} {...rest} />;
}
