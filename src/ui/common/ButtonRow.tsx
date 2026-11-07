import { HTMLAttributes } from 'react';

interface ButtonRowProps extends HTMLAttributes<HTMLDivElement> {
    align?: 'start' | 'end' | 'stretch';
    column?: boolean;
    spaced?: boolean;
    twoColumns?: boolean;
}

export function ButtonRow({ align = 'stretch', column = false, spaced = false, twoColumns = false, className, ...rest }: ButtonRowProps) {
    const classes = ['button-row', `button-row--${align}`, column && 'button-row--column', spaced && 'button-row--spaced', twoColumns && 'button-row--two-columns', className].filter(Boolean).join(' ');
    return <div className={classes} {...rest} />;
}
