import { useStore } from 'zustand';
import { DIFFICULTIES, type Difficulty } from '../../core';
import { t } from '../../i18n/t';
import { CITIZEN_STEPS } from './readerSettings';
import { readerSettingsStore } from './readerSettingsStore';

const stepOf = (citizens: number): number => {
  const index = CITIZEN_STEPS.findIndex(step => step >= citizens);
  return index === -1 ? CITIZEN_STEPS.length - 1 : index;
};

export function ReaderSettingsBar() {
  const { difficulty, citizens, set } = useStore(readerSettingsStore);
  return (
    <section aria-label={t('guide.readerSettings')} className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-line bg-panel px-4 py-3 text-sm">
      <span className="text-muted">{t('guide.readerSettings')}</span>
      <label className="flex items-center gap-2">
        <span className="text-muted">{t('guide.difficulty')}</span>
        <select className="guide-select" value={difficulty} onChange={event => set({ difficulty: event.target.value as Difficulty })}>
          {DIFFICULTIES.map(option => <option key={option} value={option}>{t(`difficulty.${option}`)}</option>)}
        </select>
      </label>
      <label className="flex min-w-56 flex-1 items-center gap-3">
        <span className="text-muted">{t('guide.citizensLabel')}</span>
        <input
          className="flex-1 accent-accent"
          type="range"
          min={0}
          max={CITIZEN_STEPS.length - 1}
          value={stepOf(citizens)}
          onChange={event => set({ citizens: CITIZEN_STEPS[Number(event.target.value)]! })}
        />
        <output className="w-28 text-right font-medium tabular-nums">{t('guide.citizens').replace('{count}', String(citizens))}</output>
      </label>
    </section>
  );
}
