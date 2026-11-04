import { useState } from 'react';
import { NATURE_TYPES, type Building } from '../../core';
import { ActionButton } from '../common/ActionButton';
import { SearchField } from '../common/SearchField';
import { t } from '../../i18n/t';
import { CloseButton } from '../common/CloseButton';
import { useGame, useUi } from '../common/hooks';
import { BuildingSearchGroup } from './BuildingSearchGroup';
import { useExpandedBranches } from './useExpandedBranches';

const NATURE = new Set<string>(NATURE_TYPES);

interface Group {
  type: Building['type'];
  name: string;
  buildings: Building[];
}

function groupByType(buildings: Building[], needle: string): Group[] {
  const groups = new Map<Building['type'], Group>();
  for (const building of [...buildings].sort((a, b) => a.id - b.id)) {
    const name = t(`building.${building.type}`);
    if (!`${name} ${building.name ?? ''}`.toLowerCase().includes(needle)) continue;
    const group = groups.get(building.type) ?? { type: building.type, name, buildings: [] };
    group.buildings.push(building);
    groups.set(building.type, group);
  }
  return [...groups.values()].sort((a, b) => Number(NATURE.has(a.type)) - Number(NATURE.has(b.type)) || a.name.localeCompare(b.name));
}

export function BuildingSearchPanel() {
  const open = useUi((store) => store.buildingSearchOpen);
  const close = useUi((store) => store.closeBuildingSearch);
  const showBuilding = useUi((store) => store.showBuilding);
  const select = useUi((store) => store.select);
  const buildings = useGame((store) => store.state.buildings);
  const { expanded, toggle, replace } = useExpandedBranches();
  const [query, setQuery] = useState('');
  if (!open) return null;

  const needle = query.trim().toLowerCase();
  const groups = groupByType(buildings, needle);
  const allExpanded = groups.length > 0 && groups.every((group) => expanded.has(group.type));
  const toggleAll = () => replace(allExpanded ? [] : groups.map((group) => group.type));
  const choose = (building: Building) => {
    showBuilding(building.id);
    select(building.id);
  };

  return (
    <section className="building-search-panel" aria-labelledby="building-search-heading">
      <header>
        <h2 id="building-search-heading">{t('search.title')}</h2>
        <CloseButton onClick={close} label={t('search.close')} />
      </header>
      <SearchField autoFocus label={t('search.placeholder')} value={query} onChange={setQuery} />
      {groups.length > 0 && needle === '' ? (
        <ActionButton size="xs" block onClick={toggleAll}>{t(allExpanded ? 'search.collapseAll' : 'search.expandAll')}</ActionButton>
      ) : null}
      {groups.length === 0 ? <p className="building-search-empty">{t('search.empty')}</p> : null}
      <ul className="building-search-tree">
        {groups.map((group) => (
          <BuildingSearchGroup
            key={group.type}
            {...group}
            expanded={needle !== '' || expanded.has(group.type)}
            onToggle={() => toggle(group.type)}
            onChoose={choose}
          />
        ))}
      </ul>
    </section>
  );
}
