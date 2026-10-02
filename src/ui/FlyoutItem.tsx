interface FlyoutItemProps {
  label: string;
  cost?: string;
  onChoose: () => void;
}

export function FlyoutItem({ label, cost, onChoose }: FlyoutItemProps) {
  return (
    <button type="button" className="flyout-item" onClick={onChoose}>
      <span>{label}</span>
      {cost ? <span className="flyout-cost">{cost}</span> : null}
    </button>
  );
}
