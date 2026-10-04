import { t } from '../../i18n/t';
import { UrbsAmount } from '../common/UrbsAmount';
import { RadioChipGroup } from '../common/RadioChipGroup';

interface StakePickerProps {
  steps: readonly number[];
  urbs: number;
  value: number;
  disabled?: boolean;
  onChange: (stake: number) => void;
}

export function StakePicker({ steps, urbs, value, disabled = false, onChange }: StakePickerProps) {
  return (
    <RadioChipGroup
      variant="toggle"
      className="stake-picker"
      chipClassName="stake-step"
      label={t('casino.stake')}
      options={steps.map(step => ({ value: step, label: <UrbsAmount value={step} />, disabled: step > urbs }))}
      value={value}
      disabled={disabled}
      onChange={onChange}
    />
  );
}
