import { ECOLOGY, WASTE, WASTE_REQUIRED_FROM_CITIZENS, difficultyOf, isAdapting, totalCitizens, wasteCodexFigures } from '../../core';
import { t } from '../../i18n/t';
import { useGame } from '../common/hooks';
import { LabeledList } from '../common/LabeledList';
import { WasteAllocationTable } from './WasteAllocationTable';
import { WasteCausesTable } from './WasteCausesTable';
import { WasteSanctionTable } from './WasteSanctionTable';

const percent = (share: number) => `${Math.round(share * 100)}%`;

export function WastePage() {
  const state = useGame(store => store.state);
  const figures = wasteCodexFigures(state);
  const difficulty = difficultyOf(state);
  const { incinerator, mound } = figures.nuisance;
  return (
    <>
      <h3 className="codex-entry-name">{t('codex.waste.title')}</h3>
      <p>{t('codex.waste.intro')}</p>
      {!figures.required && <p>{t('codex.waste.notRequired').replace('{citizens}', String(WASTE_REQUIRED_FROM_CITIZENS))}</p>}
      <h4>{t('codex.waste.production')}</h4>
      <LabeledList>
        <LabeledList.Row label={t('codex.waste.citizens')}>{totalCitizens(state)}</LabeledList.Row>
        <LabeledList.Row label={t('codex.waste.rate')}>{WASTE.unitsPerCitizenPerDay}</LabeledList.Row>
        <LabeledList.Row label={t('codex.waste.produced')}>{figures.produced.toFixed(1)}</LabeledList.Row>
        <LabeledList.Row label={t('codex.waste.processed')}>{figures.processed.toFixed(1)}</LabeledList.Row>
        <LabeledList.Row label={t('codex.waste.notCovered')}>{figures.uncoveredHomes}</LabeledList.Row>
      </LabeledList>
      <h4>{t('codex.waste.allocation')}</h4>
      <WasteAllocationTable kinds={figures.kinds} />
      <h4>{t('codex.waste.coverage')}</h4>
      <p>{t('codex.waste.covered').replace('{covered}', String(figures.homes - figures.uncoveredHomes)).replace('{homes}', String(figures.homes))}</p>
      {figures.uncoveredHomes === 0 ? <p>{t('codex.waste.noUncovered')}</p> : <WasteCausesTable causes={figures.causes} />}
      <h4>{t('codex.waste.pedestrian')}</h4>
      <p>{t('codex.waste.pedestrianHelp')}</p>
      <LabeledList>
        <LabeledList.Row label={t('codex.waste.carryingDistance')}>{figures.carried.distance}</LabeledList.Row>
        <LabeledList.Row label={t('codex.waste.surcharge')}>×{figures.carried.surcharge}</LabeledList.Row>
        <LabeledList.Row label={t('codex.waste.carriedHomes')}>{figures.carried.homes}</LabeledList.Row>
      </LabeledList>
      <h4>{t('codex.waste.nuisances')}</h4>
      <LabeledList>
        <LabeledList.Row label={`${t('building.incinerator')}: ${t('codex.waste.malus')}`}>{incinerator.malus}</LabeledList.Row>
        <LabeledList.Row label={`${t('building.incinerator')}: ${t('codex.waste.pollutionRadius')}`}>{incinerator.radius}</LabeledList.Row>
        <LabeledList.Row label={`${t('building.incinerator')}: ${t('codex.waste.emissions')}`}>{incinerator.emissionsPerHour.toFixed(2)}</LabeledList.Row>
        <LabeledList.Row label={`${t('building.incinerator')}: ${t('codex.waste.homesAffected')}`}>{incinerator.homesAffected}</LabeledList.Row>
        <LabeledList.Row label={`${t('building.mound')}: ${t('codex.waste.malus')}`}>{mound.malus}</LabeledList.Row>
        <LabeledList.Row label={`${t('building.mound')}: ${t('codex.waste.odorRadius')}`}>{mound.radius}</LabeledList.Row>
        <LabeledList.Row label={`${t('building.mound')}: ${t('codex.waste.homesAffected')}`}>{mound.homesAffected}</LabeledList.Row>
      </LabeledList>
      <p>{t('codex.waste.odorNote')}</p>
      <h4>{t('codex.waste.sanction')}</h4>
      <p>{t('codex.waste.sanctionHelp')}</p>
      <WasteSanctionTable current={difficulty} />
      <p><strong>{t('codex.sanctions.current').replace('{difficulty}', t(`difficulty.${difficulty}`))}</strong></p>
      {isAdapting(state) && difficulty !== 'cozy' && <p>{t('codex.waste.adapting').replace('{hours}', (((state.adaptationUntil ?? 0) - state.lastSeen) / ECOLOGY.hourMs).toFixed(1))}</p>}
      <h4>{t('codex.waste.total')}</h4>
      <LabeledList>
        <LabeledList.Row label={t('codex.waste.totalPerDay')}>{figures.costPerDay.toFixed(1)}</LabeledList.Row>
        <LabeledList.Row label={t('codex.waste.surchargeCost')}>{figures.surchargeCostPerDay.toFixed(1)}</LabeledList.Row>
        <LabeledList.Row label={t('codex.waste.surchargeShare')}>{percent(figures.surchargeShare)}</LabeledList.Row>
      </LabeledList>
    </>
  );
}
