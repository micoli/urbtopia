import { CROPS, type CropId } from '../../core';
import { t } from '../../i18n/t';
import { formatDuration } from '../common/formatDuration';
import { UrbsAmount } from '../common/UrbsAmount';

interface CropRowProps {
  crop: CropId;
  unlocked: boolean;
  selected: boolean;
  stock: number;
  onSelect: () => void;
  onBuy: (quantity: number) => void;
}

const PACK_SIZES = [1, 5];

export function CropRow({ crop, unlocked, selected, stock, onSelect, onBuy }: CropRowProps) {
  const spec = CROPS[crop];
  if (!unlocked) {
    return (
      <li className="crop-row crop-locked">
        🔒 {t(`item.${crop}`)} ({spec.unlockCitizens} {t('stat.citizens')})
      </li>
    );
  }
  return (
    <li className={selected ? 'crop-row crop-selected' : 'crop-row'}>
      <button type="button" aria-pressed={selected} onClick={onSelect}>
        {t(`item.${crop}`)} × {stock}
      </button>
      <small>
        {formatDuration(spec.growthMs)} · 💧{spec.water} · ▦{spec.yield}
      </small>
      {PACK_SIZES.map((quantity) => (
        <button key={quantity} type="button" onClick={() => onBuy(quantity)}>
          +{quantity} (<UrbsAmount value={quantity * spec.seedPrice} />)
        </button>
      ))}
    </li>
  );
}
