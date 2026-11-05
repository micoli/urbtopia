import { climateFigures } from '../../codex/climateFigures';
import { ECOLOGY, type GameState } from '../../core';
import { t } from '../../i18n/t';
import { LabeledList } from '../common/LabeledList';
import { ClimateCoolingTable } from './ClimateCoolingTable';
import { ClimateHeatTable } from './ClimateHeatTable';

const UNITS_PER_DEGREE = 1 / ECOLOGY.temperaturePerEmission;

interface ClimateRulesProps {
  state: GameState;
}

export function ClimateRules({ state }: ClimateRulesProps) {
  const { emissions, breakdown, elements } = climateFigures(state);
  return (
    <>
      <h3 className="codex-entry-name">{t('codex.climate.title')}</h3>
      <p>{t('codex.climate.intro')}</p>
      <p>{t('codex.climate.rules').replace('{optimal}', String(ECOLOGY.optimalTemperature)).replace('{max}', String(ECOLOGY.maxTemperature)).replace('{unit}', String(UNITS_PER_DEGREE))}</p>
      <h4>{t('codex.climate.figures')}</h4>
      <LabeledList>
        <LabeledList.Row label={t('codex.climate.optimal')}>{ECOLOGY.optimalTemperature}</LabeledList.Row>
        <LabeledList.Row label={t('codex.climate.maximum')}>{ECOLOGY.maxTemperature}</LabeledList.Row>
        <LabeledList.Row label={t('codex.climate.perUnit')}>{ECOLOGY.temperaturePerEmission}</LabeledList.Row>
        <LabeledList.Row label={t('codex.climate.perDriver')}>{ECOLOGY.carEmissionsPerDriver}</LabeledList.Row>
        <LabeledList.Row label={t('codex.climate.coal')}>{ECOLOGY.coalEmissions}</LabeledList.Row>
      </LabeledList>
      <h4>{t('codex.climate.city')}</h4>
      <LabeledList>
        <LabeledList.Row label={t('codex.climate.temperature')}>{breakdown.temperature.toFixed(1)}</LabeledList.Row>
        <LabeledList.Row label={t('codex.climate.emissions')}>{emissions.toFixed(1)}</LabeledList.Row>
        <LabeledList.Row label={t('codex.climate.cooling')}>{breakdown.cooling.toFixed(1)}</LabeledList.Row>
      </LabeledList>
      <h4>{t('codex.climate.sources')}</h4>
      <ClimateHeatTable sources={breakdown.sources} />
      <h4>{t('codex.climate.green')}</h4>
      <p>{t('codex.climate.greenHelp')}</p>
      <ClimateCoolingTable elements={elements} />
    </>
  );
}
