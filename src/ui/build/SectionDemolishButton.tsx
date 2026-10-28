import { Icon } from '../common/Icon';
interface SectionDemolishButtonProps {
  label: string;
  onChoose: () => void;
}

export function SectionDemolishButton({ label, onChoose }: SectionDemolishButtonProps) {
  return (
    <button type="button" className="section-demolish" aria-label={label} title={label} onClick={onChoose}>
      <Icon name="trash" />
    </button>
  );
}
