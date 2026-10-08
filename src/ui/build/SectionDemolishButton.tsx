interface SectionDemolishButtonProps {
  label: string;
  onChoose: () => void;
}

export function SectionDemolishButton({ label, onChoose }: SectionDemolishButtonProps) {
  return (
    <button type="button" className="section-demolish" aria-label={label} title={label} onClick={onChoose}>
      <span aria-hidden="true">🗑</span>
    </button>
  );
}
