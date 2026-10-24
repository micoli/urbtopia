import { transitReachCodexFigures, type GameState } from '../../core';
import { t } from '../../i18n/t';
import { LabeledList } from '../common/LabeledList';
import { TransitReachCategoryTable } from './TransitReachCategoryTable';
import { TransitReachFacilityTable } from './TransitReachFacilityTable';

interface TransitReachRulesProps {
  state: GameState;
}

export function TransitReachRules({ state }: TransitReachRulesProps) {
  const figures = transitReachCodexFigures(state);
  return (
    <>
      <h3 className="codex-entry-name">{t('codex.transitReach.title')}</h3>
      <p>{t('codex.transitReach.intro')}</p>
      <h4>{t('codex.transitReach.rules')}</h4>
      <LabeledList>
        <LabeledList.Row label={t('codex.transitReach.maxMinutes')}>{figures.maxMinutes}</LabeledList.Row>
        <LabeledList.Row label={t('codex.transitReach.stopTypes')}>{figures.stopTypes.map(type => t(`building.${type}`)).join(', ')}</LabeledList.Row>
        <LabeledList.Row label={t('codex.transitReach.excluded')}>{figures.excluded.map(category => t(`service.${category}`)).join(', ')}</LabeledList.Row>
      </LabeledList>
      <p>{t('codex.transitReach.rulesHelp')}</p>
      <h4>{t('codex.transitReach.network')}</h4>
      <LabeledList>
        <LabeledList.Row label={t('codex.transitReach.lines')}>{figures.lines}</LabeledList.Row>
        <LabeledList.Row label={t('codex.transitReach.stops')}>{figures.stops}</LabeledList.Row>
      </LabeledList>
      {figures.lines === 0 && <p>{t('codex.transitReach.noLine')}</p>}
      <h4>{t('codex.transitReach.categories')}</h4>
      {figures.categories.length === 0 ? <p>{t('codex.transitReach.noFacility')}</p> : <TransitReachCategoryTable categories={figures.categories} />}
      {figures.facilities.length > 0 && (
        <>
          <h4>{t('codex.transitReach.perFacility')}</h4>
          <TransitReachFacilityTable facilities={figures.facilities} />
        </>
      )}
    </>
  );
}
