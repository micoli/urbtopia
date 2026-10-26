import { ANALYTICS_LAYERS, ECOLOGY, LAND_VALUE, WASTE_FACILITIES, CONGESTION } from '../../core';
import { t } from '../../i18n/t';
import { LabeledList } from '../common/LabeledList';

const WEIGHTS = ['green', 'services', 'leisure', 'access'] as const;

export function AnalyticsPage() {
  const { odor } = WASTE_FACILITIES.mound;
  return (
    <>
      <h3 className="codex-entry-name">{t('codex.analytics.title')}</h3>
      <p>{t('codex.analytics.intro')}</p>
      <h4>{t('codex.analytics.layers')}</h4>
      <p>{t('codex.analytics.movement')}</p>
      <p>{t('codex.analytics.data')}</p>
      <ul>
        {ANALYTICS_LAYERS.map(layer => <li key={layer}>{t(`analytics.layer.${layer}`)}</li>)}
      </ul>
      <h4>{t('codex.analytics.figures')}</h4>
      <LabeledList>
        <LabeledList.Row label={t('codex.analytics.pollutionRadius')}>{ECOLOGY.coalPollutionRadius}</LabeledList.Row>
        <LabeledList.Row label={t('codex.analytics.pollutionCap')}>{ECOLOGY.coalWellbeingCap}</LabeledList.Row>
        <LabeledList.Row label={t('codex.analytics.odorRadius')}>{odor?.radius ?? 0}</LabeledList.Row>
        <LabeledList.Row label={t('codex.analytics.odorMalus')}>{odor?.malus ?? 0}</LabeledList.Row>
        <LabeledList.Row label={t('codex.analytics.congestionMax')}>{CONGESTION.maxRatio * 100}</LabeledList.Row>
      </LabeledList>
      <h4>{t('codex.analytics.landValue')}</h4>
      <p>{t('codex.analytics.landValueHelp').replace('{cut}', String(Math.round(LAND_VALUE.maxNuisanceCut * 100)))}</p>
      <LabeledList>
        {WEIGHTS.map(weight => <LabeledList.Row key={weight} label={t(`codex.analytics.weight.${weight}`)}>{Math.round(LAND_VALUE.weights[weight] * 100)}%</LabeledList.Row>)}
      </LabeledList>
      <h4>{t('codex.analytics.reading')}</h4>
      <p>{t('codex.analytics.readingHelp')}</p>
    </>
  );
}
