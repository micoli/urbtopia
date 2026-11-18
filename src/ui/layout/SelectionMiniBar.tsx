import { t } from '../../i18n/t';
import { BuildingIcon } from '../buildings/BuildingIcon';
import { useSelectedBuilding } from '../buildings/useSelectedBuilding';
import { Icon } from '../common/Icon';
import { MiniBar } from './MiniBar';

interface SelectionMiniBarProps {
  onExpand: () => void;
}

export function SelectionMiniBar({ onExpand }: SelectionMiniBarProps) {
  const building = useSelectedBuilding();
  if (!building) return <MiniBar icon={<Icon name="map" />} title={t('access.title')} onExpand={onExpand} />;
  return <MiniBar icon={<BuildingIcon building={building} />} title={t(`building.${building.type}`)} onExpand={onExpand} />;
}
