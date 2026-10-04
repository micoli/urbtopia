import { CROPS, GOODS, type CropId } from '../../core';
import { t } from '../../i18n/t';
import { formatDuration } from '../common/formatDuration';
import { UrbsAmount } from '../common/UrbsAmount';

interface CropFactsProps {
  crop: CropId;
}

export function CropFacts({ crop }: CropFactsProps) {
  const spec = CROPS[crop];
  const packed = GOODS[`${crop}Crate`];
  return (
    <dl className="codex-facts">
      <dt>{t('codex.crop.growth')}</dt>
      <dd>{formatDuration(spec.growthMs)}</dd>
      <dt>{t('codex.crop.water')}</dt>
      <dd>{spec.water}</dd>
      <dt>{t('codex.crop.yield')}</dt>
      <dd>{spec.yield}</dd>
      <dt>{t('codex.crop.seedShare')}</dt>
      <dd>{Math.round(spec.seedShare * 100)}%</dd>
      <dt>{t('codex.crop.seedPrice')}</dt>
      <dd><UrbsAmount value={spec.seedPrice} /></dd>
      <dt>{t('codex.crop.packing')}</dt>
      <dd>2 × {t(`item.${crop}`)} → {t(`item.${crop}Crate`)} · {formatDuration(packed.durationMs)}</dd>
      <dt>{t('codex.crop.packedValue')}</dt>
      <dd><UrbsAmount value={packed.value} /></dd>
    </dl>
  );
}
