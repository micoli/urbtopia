import { FIELD_COST } from '../../core';
import { t } from '../../i18n/t';
import type { Tool } from '../../tools/tools';
import { FlyoutItem } from '../layout/FlyoutItem';
import { useGame, useUi } from '../common/hooks';
import { UrbsAmount } from '../common/UrbsAmount';

export function FieldTools() {
  const hasFarm = useGame((store) => store.state.buildings.some((building) => building.type === 'farm'));
  const selectedCrop = useUi((store) => store.selectedCrop);
  const chooseTool = useUi((store) => store.chooseTool);
  if (!hasFarm) return null;
  const brush = (action: 'layField' | 'removeField' | 'harvest'): Tool => ({ kind: 'brush', action, tiles: [] });
  return (
    <>
      <FlyoutItem label={t('farm.layFields')} cost={<UrbsAmount value={FIELD_COST} />} onChoose={() => chooseTool(brush('layField'))} />
      <FlyoutItem label={t('farm.removeFields')} onChoose={() => chooseTool(brush('removeField'))} />
      {selectedCrop ? <FlyoutItem label={`${t('farm.plant')} · ${t(`item.${selectedCrop}`)}`} onChoose={() => chooseTool({ kind: 'brush', action: 'plant', crop: selectedCrop, tiles: [] })} /> : null}
      <FlyoutItem label={t('farm.harvest')} onChoose={() => chooseTool(brush('harvest'))} />
    </>
  );
}
