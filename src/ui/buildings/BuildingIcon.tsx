import { codexImageKey } from '../../codex/catalog';
import type { Building } from '../../core';
import { t } from '../../i18n/t';
import { useCodexManifest } from '../codex/useCodexManifest';

// The Codex picture of the building at its own Tier and colour, or of its first Tier when that one is missing, with the Tier as a badge.
export function BuildingIcon({ building }: { building: Building }) {
  const { manifest } = useCodexManifest();
  const image = manifest?.images[codexImageKey(building.type, building.tier, building.colorVariant)] ?? manifest?.images[codexImageKey(building.type, 1)];
  return (
    <span className="side-panel-header__icon-frame">
      {image ? <img className="side-panel-header__icon" src={`${import.meta.env.BASE_URL}codex/${image}`} alt="" draggable={false} /> : null}
      <small className="side-panel-header__level" aria-label={`${t('home.tier')} ${building.tier}`}>{building.tier}</small>
    </span>
  );
}
