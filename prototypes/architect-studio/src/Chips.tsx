interface ChipsProps<T extends string> {
  values: T[];
  labels: Record<T, string>;
  active?: T;
  onPick: (value: T) => void;
}

export function Chips<T extends string>({ values, labels, active, onPick }: ChipsProps<T>) {
  return (
    <div className="chips">
      {values.map((value) => (
        <button key={value} className={value === active ? 'chip on' : 'chip'} onClick={() => onPick(value)}>
          {labels[value]}
        </button>
      ))}
    </div>
  );
}
