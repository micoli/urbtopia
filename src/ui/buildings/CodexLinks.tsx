import { FACILITIES, hasProductionInterior, hasServiceInterior, isFacilityType, isHomeType, isVenueType, staffRolesOf, TRANSIT_REACH_STOP_TYPES, wasteKindOf, type Building } from '../../core';
import { solarCodexIdOf, type CodexId } from '../../codex/catalog';
import { t } from '../../i18n/t';
import { useUi } from '../common/hooks';
import { CodexLinkButton } from './CodexLinkButton';

const extendsOrUsesTransitReach = ({ type }: Building): boolean =>
  (TRANSIT_REACH_STOP_TYPES as readonly string[]).includes(type) || (isFacilityType(type) && FACILITIES[type].category !== 'waste' && FACILITIES[type].radius !== null);

const hasStaff = ({ type }: Building): boolean => isVenueType(type) && staffRolesOf(type).length > 0;

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
      {isFacilityType(building.type) && FACILITIES[building.type].category === 'education' && <CodexLinkButton title={t('codex.knowledge.title')} onOpen={() => openCodex(undefined, 'knowledge')} />}
      {hasStaff(building) && <CodexLinkButton title={t('codex.staff.title')} onOpen={() => openCodex(undefined, 'staff')} />}
      {hasProductionInterior(building) && <CodexLinkButton title={t('codex.productionInteriors.title')} onOpen={() => openCodex(undefined, 'productionInteriors')} />}
      {hasServiceInterior(building) && <CodexLinkButton title={t('codex.serviceInteriors.title')} onOpen={() => openCodex(undefined, 'serviceInteriors')} />}
      {wasteKindOf(building.type) && <CodexLinkButton title={t('codex.waste.title')} onOpen={() => openCodex(undefined, 'waste')} />}
    </>
  );
}
