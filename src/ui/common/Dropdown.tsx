import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

export interface DropdownOption<T extends string | number> {
    value: T;
    label: ReactNode;
    disabled?: boolean;
}

interface DropdownProps<T extends string | number> {
    label: string;
    options: readonly DropdownOption<T>[];
    value?: T;
    placeholder?: ReactNode;
    disabled?: boolean;
    className?: string;
    onChange: (value: T) => void;
}

export function Dropdown<T extends string | number>({ label, options, value, placeholder, disabled = false, className, onChange }: DropdownProps<T>) {
    const id = useId();
    const root = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);
    const selected = options.find(option => option.value === value);

    useEffect(() => {
        if (!open) return;
        const closeOnOutside = (event: PointerEvent) => {
            if (!root.current?.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener('pointerdown', closeOnOutside);
        return () => document.removeEventListener('pointerdown', closeOnOutside);
    }, [open]);

    const nextEnabled = (start: number, step: 1 | -1) => {
        for (let i = start; i >= 0 && i < options.length; i += step) if (!options[i]!.disabled) return i;
        return -1;
    };
    const show = () => {
        const current = options.findIndex(option => option.value === value);
        setActive(current >= 0 ? current : nextEnabled(0, 1));
        setOpen(true);
    };
    const choose = (index: number) => {
        const option = options[index];
        if (!option || option.disabled) return;
        onChange(option.value);
        setOpen(false);
    };
    const move = (step: 1 | -1) => {
        const next = nextEnabled(active + step, step);
        if (next >= 0) setActive(next);
    };
    const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && open) {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
            return;
        }
        if (event.key === 'Tab') return setOpen(false);
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (!open) return show();
            return move(event.key === 'ArrowDown' ? 1 : -1);
        }
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        if (!open) return show();
        choose(active);
    };

    return (
        <div className={['dropdown', className].filter(Boolean).join(' ')} ref={root}>
            <button
                type="button"
                className="dropdown-trigger"
                role="combobox"
                aria-label={label}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={`${id}-list`}
                aria-activedescendant={open && active >= 0 ? `${id}-${active}` : undefined}
                disabled={disabled}
                onClick={event => {
                    if (event.detail === 0) return;
                    if (open) return setOpen(false);
                    show();
                }}
                onKeyDown={onKeyDown}
            >
                <span>{selected?.label ?? placeholder}</span>
                <span aria-hidden="true">▾</span>
            </button>
            {open && (
                <ul className="dropdown-list" id={`${id}-list`} role="listbox" aria-label={label}>
                    {options.map((option, index) => (
                        <li
                            key={option.value}
                            id={`${id}-${index}`}
                            role="option"
                            aria-selected={option.value === value}
                            aria-disabled={option.disabled || undefined}
                            data-active={index === active}
                            onMouseDown={event => event.preventDefault()}
                            onClick={() => choose(index)}
                        >
                            {option.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
