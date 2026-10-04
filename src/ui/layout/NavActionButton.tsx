import { CSSProperties } from 'react';
import { NavIcon } from './NavIcon';
import type { NavAction } from './useNavActions';

interface NavActionButtonProps {
    action: NavAction;
    variant: 'dock' | 'bar' | 'radial';
    onClick?: () => void;
    style?: CSSProperties;
}

export function NavActionButton({ action, variant, onClick = action.onClick, style }: NavActionButtonProps) {
    const common = {
        type: 'button' as const,
        'data-action': action.id,
        'aria-pressed': action.pressed,
        disabled: action.disabled,
        'data-guided': action.guided,
        onClick,
    };
    if (variant === 'radial') {
        return (
            <button {...common} className="radial-item" aria-label={action.label} style={style}>
                <NavIcon action={action} />
            </button>
        );
    }
    if (variant === 'dock') {
        return (
            <button {...common} className="dock-button" aria-label={action.label}>
                <NavIcon action={action} />
                <span>{action.label}</span>
            </button>
        );
    }
    return (
        <button {...common} className="bottom-bar-button">
            <span aria-hidden="true">
                <NavIcon action={action} />
            </span>
            <span>{action.label}</span>
        </button>
    );
}
