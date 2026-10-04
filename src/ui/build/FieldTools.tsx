import { FIELD_COST, fieldCap } from '../../core';
import { t } from '../../i18n/t';
import type { Tool } from '../../tools/tools';
import { FlyoutItem } from '../layout/FlyoutItem';
import { useGame, useUi } from '../common/hooks';
import { UrbsAmount } from '../common/UrbsAmount';

export function FieldTools() {
  const hasFarm = useGame((store) => store.state.buildings.some((building) => building.type === 'farm'));
  const canLay = useGame((store) => store.state.fields.length < fieldCap(store.state));
  const hasFields = useGame((store) => store.state.fields.length > 0);
  const selectedCrop = useUi((store) => store.selectedCrop);
  const chooseTool = useUi((store) => store.chooseTool);
  if (!hasFarm) return null;
  const brush = (action: 'layField' | 'removeField'): Tool => ({ kind: 'brush', action, tiles: [] });
  return (
    <>
      {canLay ? <FlyoutItem label={t('farm.layFields')} cost={<UrbsAmount value={FIELD_COST} />} onChoose={() => chooseTool(brush('layField'))} /> : null}
      {hasFields ? <FlyoutItem label={t('farm.removeFields')} onChoose={() => chooseTool(brush('removeField'))} /> : null}
      {selectedCrop ? <FlyoutItem label={`${t('farm.plant')} · ${t(`item.${selectedCrop}`)}`} onChoose={() => chooseTool({ kind: 'brush', action: 'plant', crop: selectedCrop, tiles: [] })} /> : null}
    </>
  );
}
