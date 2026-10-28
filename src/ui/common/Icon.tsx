import type { LucideProps } from 'lucide-react';
import { cn } from './cn';
import { ICONS, type IconName } from './iconRegistry';
import './tailwind.css';

interface IconProps extends Omit<LucideProps, 'ref'> {
  name: IconName;
}

// Sized in em so it follows the text it sits in; decorative unless the parent carries the label.
export function Icon({ name, size = '1em', strokeWidth = 2.25, className, ...rest }: IconProps) {
  const Glyph = ICONS[name];
  return <Glyph size={size} strokeWidth={strokeWidth} aria-hidden="true" focusable="false" className={cn('inline-block shrink-0 align-[-0.125em]', className)} {...rest} />;
}
