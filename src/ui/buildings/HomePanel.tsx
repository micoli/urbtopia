import { ECOLOGY, FACILITY_TYPES, casinosReaching, poweredCasinoIds, homePower, homeBenefits, missingServices, serviceCoverage, uncoveredReason, totalCitizens, HOME_TIERS, citizensOf, taxDue, type Building } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { useGame } from '../common/hooks';
import { serviceName } from './serviceNames';
import {UrbsAmount} from "../common/UrbsAmount.tsx";
import { ActionButton } from '../common/ActionButton';
import { DrawerPanel } from '../common/DrawerPanel';

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
  return <DrawerPanel>
      <DrawerPanel.LabelValue label={t('home.citizens')} value={citizensOf(building.tier)}/>

      <DrawerPanel.LabelValue label={t('home.demand')} value={<>⚡ {homePower(building).toFixed(1)} · 💧 {spec?.water ?? 0}</>}/>
      <DrawerPanel.LabelValue label={t('home.tax')} value={<>{due}</>}/>
      <DrawerPanel.LabelValue label={t('eco.saved')} value={<>{((spec?.power ?? 0) - homePower(building)).toFixed(1)} · {t('eco.wellbeing')}: {benefits.wellbeing.toFixed(1)}</>}/>

      <DrawerPanel.LabelValue label={t('home.services')} value={<>{covered.length ? covered.map(type => t(`building.${type}`)).join(', ') : t('home.servicesNone')}</>}/>

      {leisure && <DrawerPanel.LabelValue label={t('home.leisure')} value={<>{leisure.length ? leisure.map(casino => `${t('building.casino')} ${t('home.tier')} ${casino.tier}`).join(', ') : t('home.leisureNone')}</>}/>}
      {missing.length > 0 && <DrawerPanel.LabelValue tone="warn" label={t('home.servicesMissing')} value={<>{missing.map(key => `${serviceName(key)} (${t(`home.reason.${uncoveredReason(state, building, key)}`)})`).join(', ')}{benefits.servicePenalty > 0 && ` · ${t('eco.servicePenalty')}: −${benefits.servicePenalty.toFixed(0)}`}</>}/>}
      {benefits.pollutionPenalty > 0 && <DrawerPanel.LabelValue label={t('eco.coalPenalty')} value={<>−{benefits.pollutionPenalty.toFixed(1)} · {t('eco.coalPollutionHelp')}</>}/> }

      {(['insulation', 'solar'] as const).map(equipment => {
        const installed = equipment === 'solar' ? building.solar : building.insulated;
        const cost = (equipment === 'solar' ? ECOLOGY.solarCost : ECOLOGY.insulationCost) * building.tier;
        return <ActionButton block key={equipment} disabled={installed || state.urbs < cost || totalCitizens(state) < (equipment === 'solar' ? ECOLOGY.solarUnlockCitizens : 6)} onClick={() => gameStore.getState().send({ type: 'EquipHome', buildingId: building.id, equipment })}>
          {t(equipment === 'solar' ? 'eco.retrofit' : 'eco.insulate')} · {installed ? t('eco.installed') : <UrbsAmount value={cost} />}
        </ActionButton>;
      })}
      {totalCitizens(state) < 15 && (<p>
          {t('eco.retrofit')} · {t('eco.locked')}: 15
      </p>)}
      <DrawerPanel.Upgrade building={building} />
      {due > 0 ? (
        <ActionButton variant="primary" block onClick={() => gameStore.getState().send({ type: 'Collect', buildingId: building.id })}>
          {t('panel.collect')} (+{due})
        </ActionButton>
      ) : null}
    </DrawerPanel>
}
