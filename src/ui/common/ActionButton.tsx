import { ButtonHTMLAttributes } from 'react';

type ActionButtonVariant = 'default' | 'primary' | 'danger';

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ActionButtonVariant;
    block?: boolean;
}

export function ActionButton({ variant = 'default', block = false, className, type = 'button', ...rest }: ActionButtonProps) {
    const classes = ['action-button', `action-button--${variant}`, block && 'action-button--block', className].filter(Boolean).join(' ');
    return <button type={type} className={classes} {...rest} />;
}
