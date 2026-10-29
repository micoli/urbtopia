import { FACILITIES, isFacilityType, isHomeType, TRANSIT_REACH_STOP_TYPES, wasteKindOf, type Building } from '../../core';
import { solarCodexIdOf, type CodexId } from '../../codex/catalog';
import { t } from '../../i18n/t';
import { useUi } from '../common/hooks';
import { CodexLinkButton } from './CodexLinkButton';

const extendsOrUsesTransitReach = ({ type }: Building): boolean =>
  (TRANSIT_REACH_STOP_TYPES as readonly string[]).includes(type) || (isFacilityType(type) && FACILITIES[type].category !== 'waste' && FACILITIES[type].radius !== null);

export function CodexLinks({ building }: { building: Building }) {
  const openCodex = useUi((store) => store.openCodex);
  const entries: CodexId[] = [building.type];
  if (isHomeType(building.type) && building.solar) entries.push(building.type === 'home' ? 'solarHome' : solarCodexIdOf(building.type));
  return (
    <>
      {entries.map((id) => {
        const name = t(id === building.type ? `building.${building.type}` : 'eco.solarHome');
        return <CodexLinkButton key={id} title={name} onOpen={() => openCodex(id)} />;
      })}
      {building.type === 'townHall' && <CodexLinkButton title={t('codex.politics.title')} onOpen={() => openCodex(undefined, 'politics')} />}
      {extendsOrUsesTransitReach(building) && <CodexLinkButton title={t('codex.transitReach.title')} onOpen={() => openCodex(undefined, 'transitReach')} />}
      {wasteKindOf(building.type) && <CodexLinkButton title={t('codex.waste.title')} onOpen={() => openCodex(undefined, 'waste')} />}
    </>
  );
}
