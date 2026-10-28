import type { Building } from '../../core';
import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { useGame, useUi } from '../common/hooks';
import { MODE_ICON, findLine, linesServing } from '../stats/management/transit/lineModels';
import { Icon } from '../common/Icon';

export function StopLineButtons({ building }: { building: Building }) {
  const state = useGame((store) => store.state);
  const editTransitLine = useUi((store) => store.editTransitLine);
  return (
    <>
      {linesServing(state, building.id).map((lineId) => (
        <ActionButton key={lineId} onClick={() => editTransitLine(lineId)}>
          <Icon name={MODE_ICON[findLine(state, lineId)?.mode ?? 'bus']} /> {t('eco.editLine')} #{lineId}
        </ActionButton>
      ))}
    </>
  );
}
