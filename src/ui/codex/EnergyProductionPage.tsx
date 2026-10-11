import { useState } from 'react';
import { ECOLOGY, energySources, energyStats, maxTierOf, sourceFactors } from '../../core';
import { t } from '../../i18n/t';
import { useGame } from '../common/hooks';
import { NumberStepper } from '../common/NumberStepper';
import { LabeledList } from '../common/LabeledList';
import { EnergyForecastChart } from './EnergyForecastChart';
import { EnergySourceRow } from './EnergySourceRow';
import { HydroFlowRow } from './HydroFlowRow';
import { HydroPlantRow } from './HydroPlantRow';

const MAX_SIMULATED_TILES = 20;

const percent = (value: number) => `${Math.round(value * 100)}%`;

export function EnergyProductionPage() {
  const state = useGame(store => store.state);
  const [tiles, setTiles] = useState(ECOLOGY.hydroFullFlowTiles);
  const energy = energyStats(state);
  const sources = energySources(state, energy);
  const factors = sourceFactors(state);
  const production = sources.reduce((sum, source) => sum + source.output, 0) + energy.backup;
  const hydroPlants = state.buildings.filter(building => building.type === 'hydroPlant');
  const hydroTiers = Array.from({ length: maxTierOf('hydroPlant') }, (_, index) => index + 1);
  return (
    <>
      <h3 className="codex-entry-name">{t('codex.energy.title')}</h3>
      <p>{t('codex.energy.intro')}</p>
      <h4>{t('codex.energy.city')}</h4>
      <LabeledList>
        <LabeledList.Row label={t('eco.demand')}>{energy.demand.toFixed(1)}</LabeledList.Row>
        <LabeledList.Row label={t('codex.energy.production')}>{production.toFixed(1)}</LabeledList.Row>
        <LabeledList.Row label={t('eco.unmet')}>{energy.unmet.toFixed(1)}</LabeledList.Row>
        <LabeledList.Row label={t('eco.surplus')}>{energy.surplus.toFixed(1)}</LabeledList.Row>
        <LabeledList.Row label={t('eco.storage')}>{energy.stored.toFixed(1)} / {energy.storageCapacity}</LabeledList.Row>
      </LabeledList>
      <h4>{t('codex.energy.sources')}</h4>
      <div className="codex-economy-scroll">
        <table className="codex-economy">
          <thead>
            <tr>
              <th scope="col">{t('codex.energy.source')}</th>
              <th scope="col">{t('codex.energy.copies')}</th>
              <th scope="col">{t('codex.energy.capacity')}</th>
              <th scope="col">{t('codex.energy.factor')}</th>
              <th scope="col">{t('codex.energy.output')}</th>
              <th scope="col">{t('codex.energy.share')}</th>
            </tr>
          </thead>
          <tbody>
            {sources.map(source => (
              <EnergySourceRow
                key={source.id}
                source={source}
                factor={source.capacity > 0 ? source.output / source.capacity : source.id === 'coal' ? 0 : factors[source.id]}
                demand={energy.demand}
              />
            ))}
          </tbody>
        </table>
      </div>
      <h4>{t('codex.energy.hydro')}</h4>
      {hydroPlants.length === 0 ? <p>{t('codex.energy.noHydro')}</p> : (
        <div className="codex-economy-scroll">
          <table className="codex-economy">
            <thead>
              <tr>
                <th scope="col">{t('codex.energy.plant')}</th>
                <th scope="col">{t('codex.energy.tiles')}</th>
                <th scope="col">{t('codex.energy.flow')}</th>
                <th scope="col">{t('codex.energy.output')}</th>
              </tr>
            </thead>
            <tbody>
              {hydroPlants.map(plant => <HydroPlantRow key={plant.id} state={state} plant={plant} />)}
            </tbody>
          </table>
        </div>
      )}
      <h4>{t('codex.energy.simulator')}</h4>
      <p>{t('codex.energy.simulatorHelp').replace('{full}', String(ECOLOGY.hydroFullFlowTiles))}</p>
      <NumberStepper label={t('codex.energy.tiles')} value={tiles} min={1} max={MAX_SIMULATED_TILES} onChange={setTiles} />
      <p>{t('codex.energy.flow')}: {percent(Math.min(1, tiles / ECOLOGY.hydroFullFlowTiles))}</p>
      <div className="codex-economy-scroll">
        <table className="codex-economy">
          <thead>
            <tr>
              <th scope="col">{t('codex.energy.tier')}</th>
              <th scope="col">{t('codex.energy.capacity')}</th>
              <th scope="col">{t('codex.energy.effective')}</th>
            </tr>
          </thead>
          <tbody>
            {hydroTiers.map(tier => <HydroFlowRow key={tier} tier={tier} tiles={tiles} />)}
          </tbody>
        </table>
      </div>
      <h4>{t('codex.energy.forecast')}</h4>
      <EnergyForecastChart state={state} />
    </>
  );
}
