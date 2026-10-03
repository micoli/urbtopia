interface NumberStepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

export function NumberStepper({ label, value, min, max, onChange }: NumberStepperProps) {
  const id = useId();
  const update = (next: number) => {
    if (!Number.isFinite(next)) return;
    onChange(Math.min(max, Math.max(min, Math.round(next))));
  };
  return <div className="eco-number-field"><label htmlFor={id}>{label}</label><div className="eco-number-control">
    <button type="button" aria-label={`${label} −`} disabled={value <= min} onClick={() => update(value - 1)}>−</button>
    <input id={id} type="number" min={min} max={max} value={value} onChange={event => update(event.target.valueAsNumber)} />
    <button type="button" aria-label={`${label} +`} disabled={value >= max} onClick={() => update(value + 1)}>+</button>
  </div></div>;
}
import { useId } from 'react';
