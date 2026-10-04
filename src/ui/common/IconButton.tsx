import { ButtonHTMLAttributes } from 'react';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
    label: string;
    size?: 'sm' | 'md' | 'lg';
    tone?: 'subtle' | 'light' | 'accent' | 'danger';
}

export function IconButton({ label, size = 'sm', tone = 'subtle', className, type = 'button', ...rest }: IconButtonProps) {
    const classes = ['icon-button', `icon-button--${size}`, `icon-button--${tone}`, className].filter(Boolean).join(' ');
    return <button type={type} className={classes} aria-label={label} {...rest} />;
}
