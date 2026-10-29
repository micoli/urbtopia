import { cn } from './cn';
import { TextField } from './TextField';

interface SearchFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  className?: string;
}

export function SearchField({ label, value, onChange, autoFocus, className }: SearchFieldProps) {
  return <TextField type="search" className={cn('search-field', className)} label={label} placeholder={label} value={value} onChange={onChange} autoFocus={autoFocus} />;
}
