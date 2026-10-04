import { Fragment } from 'react';
import { CROPS, GOODS, PACK_FORMATS, type CropId } from '../../core';
import { t } from '../../i18n/t';
import { itemName } from '../../i18n/itemName';
import { formatDuration } from '../common/formatDuration';
import { UrbsAmount } from '../common/UrbsAmount';

interface CropFactsProps {
  crop: CropId;
}

export function CropFacts({ crop }: CropFactsProps) {
  const spec = CROPS[crop];
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
      {PACK_FORMATS.map(({ suffix, size }) => {
        const packed = GOODS[`${crop}${suffix}`];
        return (
          <Fragment key={suffix}>
            <dt>{t('codex.crop.packing')}</dt>
            <dd>{size} × {t(`item.${crop}`)} → {itemName(`${crop}${suffix}`)} · {formatDuration(packed.durationMs)}</dd>
            <dt>{t('codex.crop.packedValue')}</dt>
            <dd><UrbsAmount value={packed.value} /></dd>
          </Fragment>
        );
      })}
    </dl>
  );
}
