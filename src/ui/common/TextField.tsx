interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  maxLength?: number;
  type?: 'text' | 'search';
  autoFocus?: boolean;
  className?: string;
}

export function TextField({ label, value, onChange, onSubmit, placeholder, maxLength, type = 'text', autoFocus, className }: TextFieldProps) {
  return (
    <input
      type={type}
      autoFocus={autoFocus}
      className={className ? `text-field ${className}` : 'text-field'}
      aria-label={label}
      autoComplete="off"
      value={value}
      placeholder={placeholder}
      maxLength={maxLength}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => event.key === 'Enter' && onSubmit?.()}
    />
  );
}
