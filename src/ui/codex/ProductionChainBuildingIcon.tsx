import type { BuildingType } from '../../core';
import { codexImageKey } from '../../codex/catalog';
import { useCodexManifest } from './useCodexManifest';

export function ProductionChainBuildingIcon({ building }: { building: BuildingType }) {
  const { manifest } = useCodexManifest();
  const image = manifest?.images[codexImageKey(building, 1)];
  if (!image) return <span className="codex-chain-icon" aria-hidden="true" />;
  return <img className="codex-chain-icon" src={`${import.meta.env.BASE_URL}codex/${image}`} alt="" draggable={false} />;
}
