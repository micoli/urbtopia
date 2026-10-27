import { useState } from 'react';
import { MAX_CITY_NAME_LENGTH } from '../../persistence/cities';
import type { RenameResult } from '../../persistence/cityActions';
import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { Note } from '../common/Note';
import { TextField } from '../common/TextField';

interface RenameCityFormProps {
  name: string;
  onRename: (name: string) => RenameResult;
}

export function RenameCityForm({ name, onRename }: RenameCityFormProps) {
  const [value, setValue] = useState(name);
  const [problem, setProblem] = useState<Exclude<RenameResult, { ok: true }>['reason'] | null>(null);
  const submit = () => {
    const result = onRename(value);
    setProblem(result.ok ? null : result.reason);
  };
  return (
    <div className="city-rename">
      <TextField label={t('cities.nameLabel')} value={value} maxLength={MAX_CITY_NAME_LENGTH + 8} onChange={setValue} onSubmit={submit} />
      <ActionButton onClick={submit} disabled={value.trim() === name}>
        {t('cities.rename')}
      </ActionButton>
      {problem && <Note>{t(`cities.error.${problem}`)}</Note>}
    </div>
  );
}
