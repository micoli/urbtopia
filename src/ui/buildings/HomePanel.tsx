import { energySavingOf, ECOLOGY, FACILITY_TYPES, casinosReaching, sportVenuesReaching, isSportVenueType, poweredCasinoIds, homePower, homeBenefits, missingServicesOf, serviceCoverage, transitReachLinks, uncoveredReason, totalCitizens, HOME_TIERS, citizensOf, taxDue, difficultyOf, homeSanction, needsContext, type Building, type FacilityType } from '../../core';
import { t } from '../../i18n/t';
import type { MessageKey } from '../../i18n/messages';
import { gameStore } from '../../store/gameStore';
import { useGame } from '../common/hooks';
import { serviceName } from './serviceNames';
import {UrbsAmount} from "../common/UrbsAmount.tsx";
import { ActionButton } from '../common/ActionButton';
import { BlockedReason } from '../common/BlockedReason';
import { urbsReason } from '../common/urbsReason';
import { DrawerPanel } from '../common/DrawerPanel';

interface HomePanelProps {
  building: Building;
}

export function HomePanel({ building }: HomePanelProps) {
  const state = useGame(s => s.state);
  const coverage = serviceCoverage(state);
  const viaTransit = transitReachLinks(state).get(building.id);
  const benefits = homeBenefits(state, building, undefined, coverage);
  const hasLeisure = state.buildings.some(b => b.type === 'casino' || isSportVenueType(b.type));
  const leisure = hasLeisure ? [
    ...casinosReaching(state, building, poweredCasinoIds(state)).map(casino => `${t('building.casino')} ${t('home.tier')} ${casino.tier}`),
    ...sportVenuesReaching(state, building).map(venue => t(`building.${venue.type}`)),
  ] : null;
  const covered = FACILITY_TYPES.filter(type => coverage.get(building.id)?.has(type));
  const stationOf = (id: number) => { const stop = state.buildings.find(b => b.id === id); return stop?.name ?? (stop ? t(`building.${stop.type}`) : ''); };
  const coveredLabel = (type: FacilityType) => {
    const link = viaTransit?.get(type);
    return link ? `${t(`building.${type}`)} (${t('home.viaStation').replace('{station}', stationOf(link.homeStopId))})` : t(`building.${type}`);
  };
  const missing = missingServicesOf(state, building, building.tier, coverage);
  const spec = HOME_TIERS[building.tier - 1];
  const due = taxDue(building);
  const insulationCost = ECOLOGY.insulationCost * building.tier;
  const sanction = difficultyOf(state) === 'cozy' ? null : homeSanction(state, building, needsContext(state));
  const sanctioned = sanction?.factor ? sanction : null;
  return <DrawerPanel>
      <DrawerPanel.LabelValue label={t('home.citizens')} value={citizensOf(building.tier)}/>

      <DrawerPanel.LabelValue label={t('home.demand')} value={<>⚡ {homePower(building, energySavingOf(state)).toFixed(1)} · 💧 {spec?.water ?? 0}</>}/>
      <DrawerPanel.LabelValue label={t('home.tax')} value={<>{due}</>}/>
      {sanctioned && <DrawerPanel.LabelValue tone="warn" label={t('home.sanction')} value={<>{t(`needs.factor.${sanctioned.factor}` as MessageKey)} · −{Math.round(100 * (1 - sanctioned.multiplier))}% {t('home.sanction.tax')}</>}/>}
      <DrawerPanel.LabelValue label={t('eco.saved')} value={<>
          {((spec?.power ?? 0) - homePower(building, energySavingOf(state))).toFixed(1)}
          <br/>
          {t('eco.wellbeing')}: {benefits.wellbeing.toFixed(1)}
      </>}/>

      <DrawerPanel.LabelValue label={t('home.services')} value={<>{covered.length ? covered.map(type => coveredLabel(type)).join(', ') : t('home.servicesNone')}</>}/>

      {leisure && <DrawerPanel.LabelValue label={t('home.leisure')} value={<>{leisure.length ? leisure.join(', ') : t('home.leisureNone')}</>}/>}
      {missing.length > 0 && <DrawerPanel.LabelValue tone="warn" label={t('home.servicesMissing')} value={<>{missing.map(key => `${serviceName(key)} (${t(`home.reason.${uncoveredReason(state, building, key)}`)})`).join(', ')}{benefits.servicePenalty > 0 && ` · ${t('eco.servicePenalty')}: −${benefits.servicePenalty.toFixed(0)}`}</>}/>}
      {missing.some(key => uncoveredReason(state, building, key) === 'capacityFull') && <BlockedReason reason={t('home.capacityFullHint')} />}
      {benefits.pollutionPenalty > 0 && <DrawerPanel.LabelValue label={t('eco.coalPenalty')} value={<>−{benefits.pollutionPenalty.toFixed(1)} · {t('eco.coalPollutionHelp')}</>}/> }

      <ActionButton block disabled={building.insulated || state.urbs < insulationCost || totalCitizens(state) < 6} onClick={() => gameStore.getState().send({ type: 'EquipHome', buildingId: building.id, equipment: 'insulation' })}>
        {t('eco.insulate')} · {building.insulated ? t('eco.installed') : <UrbsAmount value={insulationCost} />}
      </ActionButton>
      {!building.insulated && <BlockedReason reason={totalCitizens(state) < 6 ? t('blocked.insulate').replace('{citizens}', '6') : urbsReason(state.urbs, insulationCost)} />}
      {due > 0 ? (
        <ActionButton variant="primary" block onClick={() => gameStore.getState().send({ type: 'Collect', buildingId: building.id })}>
          {t('panel.collect')} (+{due})
        </ActionButton>
      ) : null}
      <DrawerPanel.Upgrade building={building} />
    </DrawerPanel>
}
