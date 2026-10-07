import { useState } from 'react';
import { CROP_IDS, FARM_TIERS, cropReturns, isCropUnlocked, type CropId } from '../../core';
import { t } from '../../i18n/t';
import { useGame } from '../common/hooks';
import { NumberStepper } from '../common/NumberStepper';
import { RadioChipGroup } from '../common/RadioChipGroup';
import { CropEconomyRow } from './CropEconomyRow';

type SortKey = 'order' | 'seeds' | 'stored' | 'profit' | 'perHour';

const SORT_VALUE: Record<Exclude<SortKey, 'order'>, (returns: ReturnType<typeof cropReturns>) => number> = {
  seeds: (returns) => returns.seeds,
  stored: (returns) => returns.stored,
  profit: (returns) => returns.profit,
  perHour: (returns) => returns.profitPerHour,
};

const MAX_TILES = Math.max(...FARM_TIERS.map((tier) => tier.fieldCap));

function sortedCrops(sort: SortKey, tiles: number): readonly CropId[] {
  if (sort === 'order') return CROP_IDS;
  const value = SORT_VALUE[sort];
  return [...CROP_IDS].sort((a, b) => value(cropReturns(b, tiles)) - value(cropReturns(a, tiles)));
}

export function CropEconomyPage() {
  const sortOptions = [
    { value: 'order', label: t('codex.economy.order') },
    { value: 'seeds', label: t('codex.economy.seeds') },
    { value: 'stored', label: t('codex.economy.stored') },
    { value: 'profit', label: t('codex.economy.profit') },
    { value: 'perHour', label: t('codex.economy.perHour') },
  ] as const;
  const state = useGame((store) => store.state);
  const [tiles, setTiles] = useState(() => Math.max(state.fields.length, 1));
  const [sort, setSort] = useState<SortKey>('order');
  return (
    <>
      <h3 className="codex-entry-name">{t('codex.economy.title')}</h3>
      <p>{t('codex.economy.intro')}</p>
      <NumberStepper label={t('codex.economy.tiles')} value={tiles} min={1} max={MAX_TILES} onChange={setTiles} />
      <RadioChipGroup className="codex-economy-sort" label={t('codex.economy.sortBy')} options={sortOptions} value={sort} onChange={setSort} />
      <div className="codex-economy-scroll">
        <table className="codex-economy">
          <thead>
            <tr>
              <th scope="col">{t('codex.economy.crop')}</th>
              <th scope="col">{t('codex.economy.seeds')}</th>
              <th scope="col">{t('codex.economy.stored')}</th>
              <th scope="col">{t('codex.economy.cropValue')}</th>
              <th scope="col">{t('codex.economy.seedBalance')}</th>
              <th scope="col">{t('codex.economy.profit')}</th>
              <th scope="col">{t('codex.economy.perHour')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedCrops(sort, tiles).map((crop) => (
              <CropEconomyRow key={crop} crop={crop} tiles={tiles} unlocked={isCropUnlocked(state, crop)} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
