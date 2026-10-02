import { t } from '../i18n/t';
import { useUi } from './hooks';

export function ConfirmPad() {
  const tool = useUi((store) => store.tool);
  const evaluation = useUi((store) => store.evaluation);
  const confirm = useUi((store) => store.confirm);
  const cancelTool = useUi((store) => store.cancelTool);
  const rotate = useUi((store) => store.rotate);
  if (!tool || !evaluation) return null;

  const canRotate = tool.kind === 'road' ? tool.start !== null : evaluation.rotation !== null;
  const needsStart = tool.kind === 'road' && tool.start === null;
  const canConfirm = evaluation.valid || needsStart;
  return (
    <div className="confirm-pad">
      <div className="confirm-info">
        {needsStart ? <span>{t('pad.roadStart')}</span> : null}
        {evaluation.cost ? <span className="confirm-cost">{evaluation.cost} {t('stat.urbs')}</span> : null}
        {evaluation.issue ? <span className="confirm-issue">{t(evaluation.issue)}</span> : null}
      </div>
      <div className="confirm-buttons">
        <button type="button" className="pad-button pad-cancel" aria-label={t('pad.cancel')} onClick={cancelTool}>
          ✗
        </button>
        <button type="button" className="pad-button" aria-label={t('pad.rotate')} disabled={!canRotate} onClick={rotate}>
          ⟳
        </button>
        <button type="button" className="pad-button pad-confirm" aria-label={t('pad.confirm')} disabled={!canConfirm} onClick={confirm}>
          ✓
        </button>
      </div>
    </div>
  );
}
