import { IconButton } from './IconButton';

interface NumberStepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

export function NumberStepper({ label, value, min, max, onChange }: NumberStepperProps) {
  const update = (next: number) => onChange(Math.min(max, Math.max(min, Math.round(next))));
  return <div className="eco-number-field" role="group" aria-label={label}>
    <span>{label}</span>
    <div className="eco-number-control">
      <IconButton label={`${label} −`} disabled={value <= min} onClick={() => update(value - 1)}>−</IconButton>
      <span className="eco-number-value" aria-live="polite">{value}</span>
      <IconButton label={`${label} +`} disabled={value >= max} onClick={() => update(value + 1)}>+</IconButton>
    </div>
  </div>;
}
