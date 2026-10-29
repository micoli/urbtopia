import { FACILITIES, isFacilityType, isHomeType, TRANSIT_REACH_STOP_TYPES, wasteKindOf, type Building } from '../../core';
import { solarCodexIdOf, type CodexId } from '../../codex/catalog';
import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { useUi } from '../common/hooks';
import { Icon } from '../common/Icon';

const extendsOrUsesTransitReach = ({ type }: Building): boolean =>
  (TRANSIT_REACH_STOP_TYPES as readonly string[]).includes(type) || (isFacilityType(type) && FACILITIES[type].category !== 'waste' && FACILITIES[type].radius !== null);

export function CodexLinks({ building }: { building: Building }) {
  const openCodex = useUi((store) => store.openCodex);
  const entries: CodexId[] = [building.type];
  if (isHomeType(building.type) && building.solar) entries.push(building.type === 'home' ? 'solarHome' : solarCodexIdOf(building.type));
  return (
    <>
      {entries.map((id) => (
        <ActionButton key={id} aria-label={t('codex.about').replace('{name}', t(id === building.type ? `building.${building.type}` : 'eco.solarHome'))} onClick={() => openCodex(id)}>
          <Icon name="info" /> {t(id === building.type ? `building.${building.type}` : 'eco.solarHome')}
        </ActionButton>
      ))}
      {building.type === 'townHall' && (
        <ActionButton aria-label={t('codex.about').replace('{name}', t('codex.politics.title'))} onClick={() => openCodex(undefined, 'politics')}>
          <Icon name="info" /> {t('codex.politics.title')}
        </ActionButton>
      )}
      {extendsOrUsesTransitReach(building) && (
        <ActionButton aria-label={t('codex.about').replace('{name}', t('codex.transitReach.title'))} onClick={() => openCodex(undefined, 'transitReach')}>
          <Icon name="info" /> {t('codex.transitReach.title')}
        </ActionButton>
      )}
      {wasteKindOf(building.type) && (
        <ActionButton aria-label={t('codex.about').replace('{name}', t('codex.waste.title'))} onClick={() => openCodex(undefined, 'waste')}>
          <Icon name="info" /> {t('codex.waste.title')}
        </ActionButton>
      )}
    </>
  );
}
