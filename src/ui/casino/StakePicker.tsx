import { t } from '../../i18n/t';
import { UrbsAmount } from '../common/UrbsAmount';

interface StakePickerProps {
  steps: readonly number[];
  urbs: number;
  value: number;
  disabled?: boolean;
  onChange: (stake: number) => void;
}

export function StakePicker({ steps, urbs, value, disabled = false, onChange }: StakePickerProps) {
  return (
    <div className="stake-picker" role="group" aria-label={t('casino.stake')}>
      {steps.map(step => (
        <button key={step} type="button" className="stake-step" aria-pressed={step === value} disabled={disabled || step > urbs} onClick={() => onChange(step)}>
          <UrbsAmount value={step} />
        </button>
      ))}
    </div>
  );
}
