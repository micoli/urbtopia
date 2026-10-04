import { FACILITIES, citizensOf, facilityCapacity, serviceCoverage, type Building, type FacilityType } from '../../core';
import { t } from '../../i18n/t';
import { useGame } from '../common/hooks';
import { ReachToggle } from './ReachToggle';
import { UpgradeSection } from './UpgradeSection';

interface FacilityPanelProps {
  building: Building & { type: FacilityType };
}

export function FacilityPanel({ building }: FacilityPanelProps) {
  const state = useGame(s => s.state);
  const { radius } = FACILITIES[building.type];
  const capacity = facilityCapacity(building.type, building.tier);
  const coverage = serviceCoverage(state);
  const served = state.buildings.reduce((total, home) => total + (home.type === 'home' && coverage.get(home.id)?.has(building.type) ? citizensOf(home.tier) : 0), 0);
  return (
    <section className="production">
        <h3><strong>{t('home.tier')}</strong> {building.tier}</h3>
        <p><strong>{t('facility.reach')}</strong>: {radius === null ? t('placement.cityWide') : `${2 * radius} × ${2 * radius}`}</p>
        {radius !== null && <ReachToggle />}
        <p><strong>{t('facility.capacity')}</strong>: {capacity === null ? t('facility.unlimited') : capacity} · {t('facility.served')}: {served}</p>
      <UpgradeSection building={building} />
    </section>
  );
}
