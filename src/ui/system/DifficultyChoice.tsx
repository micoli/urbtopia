import { DIFFICULTIES, type Difficulty } from '../../core';
import { t } from '../../i18n/t';
import { RadioChipGroup } from '../common/RadioChipGroup';
import { difficultyDescription } from '../common/difficultyDescription';

interface DifficultyChoiceProps {
  label: string;
  value: Difficulty;
  onChange: (difficulty: Difficulty) => void;
}

export function DifficultyChoice({ label, value, onChange }: DifficultyChoiceProps) {
  return (
    <div className="difficulty-choice">
      <RadioChipGroup className="prefs-group" label={label} options={DIFFICULTIES.map(id => ({ value: id, label: t(`difficulty.${id}`) }))} value={value} onChange={onChange} />
      <small>{difficultyDescription(value)}</small>
    </div>
  );
}
