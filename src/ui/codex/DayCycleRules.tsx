import { dayCycleFigures } from '../../codex/dayCycleFigures';
import type { GameState } from '../../core';
import { t } from '../../i18n/t';
import { LabeledList } from '../common/LabeledList';
import { DayCycleHoursTable } from './DayCycleHoursTable';

const clock = (hour: number) => `${String(hour).padStart(2, '0')}:00`;

interface DayCycleRulesProps {
  state: GameState;
}

export function DayCycleRules({ state }: DayCycleRulesProps) {
  const figures = dayCycleFigures(state);
  return (
    <>
      <h3 className="codex-entry-name">{t('codex.dayCycle.title')}</h3>
      <p>{t('codex.dayCycle.intro')}</p>
      <h4>{t('codex.dayCycle.figures')}</h4>
      <LabeledList>
        <LabeledList.Row label={t('codex.dayCycle.length')}>{figures.durationHours}</LabeledList.Row>
        <LabeledList.Row label={t('codex.dayCycle.cycleHours')}>{figures.cycleHours}</LabeledList.Row>
        <LabeledList.Row label={t('codex.dayCycle.cycleHourLength')}>{figures.cycleHourMinutes}</LabeledList.Row>
        <LabeledList.Row label={t('codex.dayCycle.daytime')}>{`${figures.daytimeHours} (${clock(figures.daytimeStart)}–${clock(figures.daytimeEnd)})`}</LabeledList.Row>
        <LabeledList.Row label={t('codex.dayCycle.night')}>{figures.nightHours}</LabeledList.Row>
        <LabeledList.Row label={t('codex.dayCycle.fade')}>{figures.fadeHours}</LabeledList.Row>
        <LabeledList.Row label={t('codex.dayCycle.now')}>{t('codex.dayCycle.nowValue').replace('{phase}', t(`codex.dayCycle.phase.${figures.current.phase}`)).replace('{hour}', clock(figures.current.hour))}</LabeledList.Row>
      </LabeledList>
      <h4>{t('codex.dayCycle.hourly')}</h4>
      <p>{t('codex.dayCycle.hourlyHelp')}</p>
      <DayCycleHoursTable hours={figures.hours} current={figures.current.hour} />
      <h4>{t('codex.dayCycle.notes')}</h4>
      <p>{t('codex.dayCycle.windNote')}</p>
      <p>{t('codex.dayCycle.hourNote')}</p>
      <p>{t('codex.dayCycle.alwaysDayNote')}</p>
    </>
  );
}
