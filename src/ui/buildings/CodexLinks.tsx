import { isHomeType, type Building } from '../../core';
import { solarCodexIdOf, type CodexId } from '../../codex/catalog';
import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { useUi } from '../common/hooks';

export function CodexLinks({ building }: { building: Building }) {
  const openCodex = useUi((store) => store.openCodex);
  const entries: CodexId[] = [building.type];
  if (isHomeType(building.type) && building.solar) entries.push(building.type === 'home' ? 'solarHome' : solarCodexIdOf(building.type));
  return (
    <>
      {entries.map((id) => (
        <ActionButton key={id} aria-label={t('codex.about').replace('{name}', t(id === building.type ? `building.${building.type}` : 'eco.solarHome'))} onClick={() => openCodex(id)}>
          {t(id === building.type ? `building.${building.type}` : 'eco.solarHome')}&nbsp;?
        </ActionButton>
      ))}
    </>
  );
}
