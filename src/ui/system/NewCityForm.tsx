import { useState } from 'react';
import type { Difficulty } from '../../core';
import { t } from '../../i18n/t';
import { DifficultyChoice } from './DifficultyChoice';
import { InlineConfirm } from '../common/InlineConfirm';
import { Note } from '../common/Note';

interface NewCityFormProps {
  full: boolean;
  onCreate: (difficulty: Difficulty) => void;
}

export function NewCityForm({ full, onCreate }: NewCityFormProps) {
  const [confirming, setConfirming] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('cozy');
  if (full) return <Note tone="muted">{t('cities.limit')}</Note>;
  return (
    <>
      {confirming && <DifficultyChoice label={t('difficulty.newGame')} value={difficulty} onChange={setDifficulty} />}
      <InlineConfirm
        confirming={confirming}
        triggerLabel={t('cities.new')}
        confirmLabel={t('cities.new')}
        message={t('cities.newConfirm')}
        onRequest={() => setConfirming(true)}
        onCancel={() => setConfirming(false)}
        onConfirm={() => onCreate(difficulty)}
      />
    </>
  );
}
