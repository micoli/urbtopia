import { HTMLAttributes } from 'react';

interface ButtonRowProps extends HTMLAttributes<HTMLDivElement> {
    align?: 'start' | 'end' | 'stretch';
    column?: boolean;
    spaced?: boolean;
}

export function ButtonRow({ align = 'stretch', column = false, spaced = false, className, ...rest }: ButtonRowProps) {
    const classes = ['button-row', `button-row--${align}`, column && 'button-row--column', spaced && 'button-row--spaced', className].filter(Boolean).join(' ');
    return <div className={classes} {...rest} />;
}
