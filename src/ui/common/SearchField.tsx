import { cn } from './cn';

interface SearchFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  className?: string;
}

export function SearchField({ label, value, onChange, autoFocus, className }: SearchFieldProps) {
  return <input type="search" className={cn('search-field', className)} aria-label={label} placeholder={label} value={value} autoFocus={autoFocus} onChange={(event) => onChange(event.target.value)} />;
}
