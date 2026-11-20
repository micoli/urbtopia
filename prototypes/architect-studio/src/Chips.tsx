import { RadioChipGroup } from '../../../src/ui/common/RadioChipGroup.tsx';

interface ChipsProps<T extends string> {
  label: string;
  values: readonly T[];
  labels: Record<T, string>;
  active?: T;
  onPick: (value: T) => void;
}

export function Chips<T extends string>({ label, values, labels, active, onPick }: ChipsProps<T>) {
  return <RadioChipGroup className="choice-chips" label={label} options={values.map((value) => ({ value, label: labels[value] }))} value={active as T} onChange={onPick} />;
}
