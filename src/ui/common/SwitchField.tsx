import { useId } from 'react';

interface SwitchFieldProps {
    label?: string;
    // The accessible name of a switch that shows no label.
    ariaLabel?: string;
    description?: string;
    checked: boolean;
    disabled?: boolean;
    onChange: (checked: boolean) => void;
}

export function SwitchField({ label, ariaLabel, description, checked, disabled, onChange }: SwitchFieldProps) {
    const id = useId();
    return (
        <button type="button" role="switch" aria-checked={checked} aria-label={label === undefined ? ariaLabel : undefined} aria-labelledby={label === undefined ? undefined : `${id}-label`} aria-describedby={description ? `${id}-description` : undefined} className="switch-field" disabled={disabled} onClick={() => onChange(!checked)}>
            {label === undefined ? null : (
                <span className="setting-text">
                    <span id={`${id}-label`} className="setting-text__label">{label}</span>
                    {description ? <small id={`${id}-description`} className="setting-text__description">{description}</small> : null}
                </span>
            )}
            <span className="switch-field__track" aria-hidden="true" />
        </button>
    );
}
