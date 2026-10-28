import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from './cn';
import './tailwind.css';

const button = cva(
  'inline-flex items-center justify-center gap-2 rounded-ui-lg border-0 px-3 [font-family:inherit] [font-size:inherit] cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ui-focus disabled:opacity-40 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-ui-muted text-ui-text hover:bg-ui-muted-hover',
        primary: 'bg-ui-accent text-ui-on-accent font-bold hover:brightness-110',
        danger: 'bg-ui-danger text-ui-on-danger hover:brightness-110',
        ghost: 'bg-transparent text-ui-text hover:bg-ui-muted',
      },
      size: {
        md: 'min-h-12',
        sm: 'min-h-9 rounded-ui-md text-sm',
      },
      block: { true: 'w-full', false: '' },
    },
    defaultVariants: { variant: 'default', size: 'md', block: false },
  },
);

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof button> {}

export function Button({ variant, size, block, className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={cn(button({ variant, size, block }), className)} {...rest} />;
}
