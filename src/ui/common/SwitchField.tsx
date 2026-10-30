import { useId } from 'react';

interface SwitchFieldProps {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export function SwitchField({ label, description, checked, onChange }: SwitchFieldProps) {
    const id = useId();
    return (
        <button type="button" role="switch" aria-checked={checked} aria-labelledby={`${id}-label`} aria-describedby={description ? `${id}-description` : undefined} className="switch-field" onClick={() => onChange(!checked)}>
            <span className="setting-text">
                <span id={`${id}-label`} className="setting-text__label">{label}</span>
                {description ? <small id={`${id}-description`} className="setting-text__description">{description}</small> : null}
            </span>
            <span className="switch-field__track" aria-hidden="true" />
        </button>
    );
}
