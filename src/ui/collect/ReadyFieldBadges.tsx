import { isCropReady, itemModelOf } from '../../core';
import { useGame } from '../common/hooks';
import { CollectBadge } from './CollectBadge';

export function ReadyFieldBadges() {
  const fields = useGame((store) => store.state.fields);
  const now = useGame((store) => store.state.lastSeen);
  return (
    <>
      {fields.map((field) =>
        field.crop && isCropReady(field.crop, now) ? (
          <CollectBadge
            key={`${field.x},${field.y}`}
            worldX={field.x + 0.5}
            worldZ={field.y + 0.5}
            label="✓"
            models={[itemModelOf(field.crop.species)].filter((model) => model !== null)}
            command={{ type: 'Harvest', tiles: [{ x: field.x, y: field.y }] }}
          />
        ) : null,
      )}
    </>
  );
}
