import { BUILDING_SPECS, frontAccessModes, type Building } from '../../core';
import { t } from '../../i18n/t';
import { useGame } from '../common/hooks';
import { DrawerPanel } from '../common/DrawerPanel';

interface BuildingAccessProps {
  building: Building;
}

export function BuildingAccess({ building }: BuildingAccessProps) {
  const state = useGame((store) => store.state);
  if (!BUILDING_SPECS[building.type].accessModes.includes('brt')) return null;
  const modes = frontAccessModes(state, building.type, building.x, building.y, building.rotation, building.tier);
  const access = modes.length === 2 ? 'both' : modes[0] ?? 'none';
  return <DrawerPanel><DrawerPanel.LabelValue label={t('panel.access')} value={t(`panel.access.${access}`)} /></DrawerPanel>;
}
