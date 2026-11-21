interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  maxLength?: number;
  type?: 'text' | 'search';
  autoFocus?: boolean;
  readOnly?: boolean;
  onClick?: () => void;
  className?: string;
}

export function TextField({ label, value, onChange, onSubmit, onBlur, placeholder, maxLength, type = 'text', autoFocus, readOnly, onClick, className }: TextFieldProps) {
  return (
    <input
      type={type}
      autoFocus={autoFocus}
      readOnly={readOnly}
      onClick={onClick}
      className={className ? `text-field ${className}` : 'text-field'}
      aria-label={label}
      autoComplete="off"
      value={value}
      placeholder={placeholder}
      maxLength={maxLength}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      onKeyDown={(event) => event.key === 'Enter' && onSubmit?.()}
    />
  );
}
