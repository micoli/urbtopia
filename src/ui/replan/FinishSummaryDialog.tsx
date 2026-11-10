import { useStore } from 'zustand';
import type { MessageKey } from '../../i18n/messages';
import { t } from '../../i18n/t';
import { replanSummaryStore } from '../../store/replanSummaryStore';
import { ActionButton } from '../common/ActionButton';
import { CoordinatesLink } from '../common/CoordinatesLink';
import { Dialog } from '../common/Dialog';
import { useGame } from '../common/hooks';

export function FinishSummaryDialog() {
  const summary = useStore(replanSummaryStore, (store) => store.summary);
  const dismiss = useStore(replanSummaryStore, (store) => store.dismiss);
  const buildings = useGame((store) => store.state.buildings);
  if (!summary) return null;
  const stranded = summary.withoutAccess.flatMap(({ id, type }) => {
    const building = buildings.find((candidate) => candidate.id === id);
    return building ? [{ id, type, x: building.x, y: building.y }] : [];
  });

  return (
    <Dialog>
      <Dialog.Title>{t('replan.summary.title')}</Dialog.Title>
      <Dialog.Body>
        {stranded.length > 0 ? (
          <>
            <p>{t('replan.summary.noAccess')}</p>
            <ul>
              {stranded.map((building) => (
                <li key={building.id}>{t(`building.${building.type}` as MessageKey)} <CoordinatesLink x={building.x} y={building.y} /></li>
              ))}
            </ul>
          </>
        ) : null}
        {summary.brokenLines > 0 ? <p>{t('replan.summary.lines')} ({summary.brokenLines})</p> : null}
      </Dialog.Body>
      <Dialog.Actions>
        <ActionButton variant="primary" onClick={dismiss}>{t('replan.summary.ok')}</ActionButton>
      </Dialog.Actions>
    </Dialog>
  );
}
