import { ReactNode } from 'react';

export interface RadioChipOption<T extends string | number> {
    value: T;
    label: ReactNode;
    disabled?: boolean;
}

interface RadioChipGroupProps<T extends string | number> {
    label: string;
    options: readonly RadioChipOption<T>[];
    value: T;
    onChange: (value: T) => void;
    variant?: 'radio' | 'toggle';
    disabled?: boolean;
    className?: string;
    chipClassName?: string;
}

export function RadioChipGroup<T extends string | number>({ label, options, value, onChange, variant = 'radio', disabled = false, className, chipClassName }: RadioChipGroupProps<T>) {
    const radio = variant === 'radio';
    return (
        <div className={className} role={radio ? 'radiogroup' : 'group'} aria-label={label}>
            {options.map(option => {
                const selected = option.value === value;
                const selection = radio ? { role: 'radio', 'aria-checked': selected } : { 'aria-pressed': selected };
                return (
                    <button key={option.value} type="button" className={chipClassName} disabled={disabled || option.disabled} onClick={() => onChange(option.value)} {...selection}>
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
