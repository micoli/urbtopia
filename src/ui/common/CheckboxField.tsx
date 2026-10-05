interface CheckboxFieldProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export function CheckboxField({ label, checked, onChange }: CheckboxFieldProps) {
    return (
        <button type="button" role="checkbox" aria-checked={checked} className="prefs-toggle" onClick={() => onChange(!checked)}>
            <span className="prefs-toggle__box" aria-hidden="true" />
            {label}
        </button>
    );
}
