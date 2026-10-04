import { CROPS, GOODS, PACK_FORMATS, type CropId } from '../../core';
import { t } from '../../i18n/t';
import { itemName } from '../../i18n/itemName';
import { formatDuration } from '../common/formatDuration';
import { LabeledList } from '../common/LabeledList';
import { UrbsAmount } from '../common/UrbsAmount';

interface CropFactsProps {
  crop: CropId;
}

export function CropFacts({ crop }: CropFactsProps) {
  const spec = CROPS[crop];
  return (
    <LabeledList className="codex-facts">
      <LabeledList.Row label={t('codex.crop.growth')}>{formatDuration(spec.growthMs)}</LabeledList.Row>
      <LabeledList.Row label={t('codex.crop.water')}>{spec.water}</LabeledList.Row>
      <LabeledList.Row label={t('codex.crop.yield')}>{spec.yield}</LabeledList.Row>
      <LabeledList.Row label={t('codex.crop.seedShare')}>{Math.round(spec.seedShare * 100)}%</LabeledList.Row>
      <LabeledList.Row label={t('codex.crop.seedPrice')}><UrbsAmount value={spec.seedPrice} /></LabeledList.Row>
      {PACK_FORMATS.flatMap(({ suffix, size }) => {
        const packed = GOODS[`${crop}${suffix}`];
        return [
          <LabeledList.Row key={`${suffix}-packing`} label={t('codex.crop.packing')}>
            {size} × {t(`item.${crop}`)} → {itemName(`${crop}${suffix}`)} · {formatDuration(packed.durationMs)}
          </LabeledList.Row>,
          <LabeledList.Row key={`${suffix}-value`} label={t('codex.crop.packedValue')}>
            <UrbsAmount value={packed.value} />
          </LabeledList.Row>,
        ];
      })}
    </LabeledList>
  );
}
