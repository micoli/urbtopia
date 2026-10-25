import { maxTierOf, type Building } from '../../core';
import { ProductionChainBuildingIcon } from '../codex/ProductionChainBuildingIcon';
import { progressColor } from '../common/progressColor';

interface BuildingSearchGroupProps {
  type: Building['type'];
  name: string;
  buildings: Building[];
  expanded: boolean;
  onToggle: () => void;
  onChoose: (building: Building) => void;
}

function levelProgress({ type, tier }: Building): number {
  return (tier - 1) / (maxTierOf(type) - 1);
}

export function BuildingSearchGroup({ type, name, buildings, expanded, onToggle, onChoose }: BuildingSearchGroupProps) {
  const upgradable = maxTierOf(type) > 1;
  return (
    <li className="building-search-group">
      <button type="button" className="building-search-branch" aria-expanded={expanded} onClick={onToggle}>
        <span className="building-search-chevron" aria-hidden="true">{expanded ? '▾' : '▸'}</span>
        <ProductionChainBuildingIcon building={type} />
        <span className="building-search-name">{name}</span>
        <span className="building-search-count">{buildings.length}</span>
      </button>
      {expanded ? (
        <ul className="building-search-results">
          {buildings.map((building) => (
            <li key={building.id}>
              <button type="button" className="building-search-result" onClick={() => onChoose(building)}>
                <code>{building.x}, {building.y}</code>
                <span className="building-search-name">{building.name}</span>
                {upgradable ? (
                  <span className="building-search-level" style={{ background: progressColor(levelProgress(building), 0.85) }}>
                    {building.tier}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}
