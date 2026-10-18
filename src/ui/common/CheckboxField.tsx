interface CheckboxFieldProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

export function CheckboxField({ label, checked, onChange, disabled }: CheckboxFieldProps) {
    return (
        <button type="button" role="checkbox" aria-checked={checked} disabled={disabled} className="prefs-toggle" onClick={() => onChange(!checked)}>
            <span className="prefs-toggle__box" aria-hidden="true" />
            {label}
        </button>
    );
}
