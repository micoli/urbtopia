import { ECOLOGY, FACILITY_TYPES, casinosReaching, poweredCasinoIds, homePower, homeBenefits, missingServices, serviceCoverage, uncoveredReason, totalCitizens, HOME_TIERS, citizensOf, taxDue, type Building } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { useGame } from '../common/hooks';
import { serviceName } from './serviceNames';
import { UpgradeSection } from './UpgradeSection';
import {UrbsAmount} from "../common/UrbsAmount.tsx";

interface HomePanelProps {
  building: Building;
}

export function HomePanel({ building }: HomePanelProps) {
  const state = useGame(s => s.state);
  const coverage = serviceCoverage(state);
  const benefits = homeBenefits(state, building, undefined, coverage);
  const leisure = state.buildings.some(b => b.type === 'casino') ? casinosReaching(state, building, poweredCasinoIds(state)) : null;
  const covered = FACILITY_TYPES.filter(type => coverage.get(building.id)?.has(type));
  const missing = missingServices(coverage, building);
  const spec = HOME_TIERS[building.tier - 1];
  const due = taxDue(building);
  return (
    <section className="production">
      <h3>
          <strong>{t('home.tier')}</strong> {building.tier}
      </h3>
      <p>
          <strong>{t('home.citizens')}</strong>: {citizensOf(building.tier)}
      </p>
      <p>
          <strong>{t('home.demand')}</strong>: ⚡ {homePower(building).toFixed(1)} · 💧 {spec?.water ?? 0}
      </p>
      <p>
          <strong>{t('home.tax')}</strong>: {due}
      </p>
      <p>
          <strong>{t('eco.saved')}</strong>: {((spec?.power ?? 0) - homePower(building)).toFixed(1)} · {t('eco.wellbeing')}: {benefits.wellbeing.toFixed(1)}
      </p>
      <p>
          <strong>{t('home.services')}</strong>: {covered.length ? covered.map(type => t(`building.${type}`)).join(', ') : t('home.servicesNone')}
      </p>
      {leisure && (<p>
          <strong>{t('home.leisure')}</strong>: {leisure.length ? leisure.map(casino => `${t('building.casino')} ${t('home.tier')} ${casino.tier}`).join(', ') : t('home.leisureNone')}
      </p>)}
      {missing.length > 0 && (<p className="stat-tight">
          <strong>{t('home.servicesMissing')}</strong>: {missing.map(key => `${serviceName(key)} (${t(`home.reason.${uncoveredReason(state, building, key)}`)})`).join(', ')}{benefits.servicePenalty > 0 && ` · ${t('eco.servicePenalty')}: −${benefits.servicePenalty.toFixed(0)}`}
      </p>)}
      {benefits.pollutionPenalty > 0 && (<p>
          <strong>{t('eco.coalPenalty')}</strong>: −{benefits.pollutionPenalty.toFixed(1)} · {t('eco.coalPollutionHelp')}
      </p>)}
      {(['insulation', 'solar'] as const).map(equipment => {
        const installed = equipment === 'solar' ? building.solar : building.insulated;
        const cost = (equipment === 'solar' ? ECOLOGY.solarCost : ECOLOGY.insulationCost) * building.tier;
        return <button type="button" className="panel-button" key={equipment} disabled={installed || state.urbs < cost || totalCitizens(state) < (equipment === 'solar' ? ECOLOGY.solarUnlockCitizens : 6)} onClick={() => gameStore.getState().send({ type: 'EquipHome', buildingId: building.id, equipment })}>
          {t(equipment === 'solar' ? 'eco.retrofit' : 'eco.insulate')} · {installed ? t('eco.installed') : <UrbsAmount value={cost} />}
        </button>;
      })}
      {totalCitizens(state) < 15 && (<p>
          {t('eco.retrofit')} · {t('eco.locked')}: 15
      </p>)}
      <UpgradeSection building={building} />
      {due > 0 ? (
        <button type="button" className="collect-button" onClick={() => gameStore.getState().send({ type: 'Collect', buildingId: building.id })}>
          {t('panel.collect')} (+{due})
        </button>
      ) : null}
    </section>
  );
}
