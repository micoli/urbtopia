interface FlyoutItemProps {
  label: string;
  cost?: string;
  guided?: boolean;
  onChoose: () => void;
}

export function FlyoutItem({ label, cost, guided = false, onChoose }: FlyoutItemProps) {
  return (
    <button type="button" className="flyout-item" data-guided={guided} onClick={onChoose}>
      <span>{label}</span>
      {cost ? <span className="flyout-cost">{cost}</span> : null}
    </button>
  );
}
