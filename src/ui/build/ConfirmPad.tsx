import { t } from '../../i18n/t';
import { CurrencyText } from '../common/CurrencyText';
import { useUi } from '../common/hooks';
import { UrbsAmount } from '../common/UrbsAmount';
import { useConfirmKeys } from './useConfirmKeys';

export function ConfirmPad() {
  const tool = useUi((store) => store.tool);
  const evaluation = useUi((store) => store.evaluation);
  const confirm = useUi((store) => store.confirm);
  const cancelTool = useUi((store) => store.cancelTool);
  const rotate = useUi((store) => store.rotate);
  const isPathTool = tool?.kind === 'road' || tool?.kind === 'demolishRoad';
  const needsStart = isPathTool && tool.start === null;
  const canConfirm = Boolean(evaluation?.valid) || needsStart;
  const canRotate = isPathTool ? tool.start !== null : evaluation?.rotation != null;
  useConfirmKeys({ active: Boolean(tool && evaluation), canConfirm, canRotate, onConfirm: confirm, onRotate: rotate, onCancel: cancelTool });
  if (!tool || !evaluation) return null;
  return (
    <div className="confirm-pad">
      <div className="confirm-info">
        {needsStart ? <span>{t(tool.kind === 'road' ? 'pad.roadStart' : 'pad.demolishStart')}</span> : null}
        {tool.kind === 'parcel' && !evaluation.valid && !evaluation.issue ? <span>{t('pad.parcelHint')}</span> : null}
        {evaluation.coverage ? <span>{evaluation.coverage.cityWide ? `${t('placement.cityWide')} · ` : ''}{t('placement.covers')}: {evaluation.coverage.homes}</span> : null}
        {evaluation.cost ? (
          <span className="confirm-cost">
            <UrbsAmount value={evaluation.cost} />
          </span>
        ) : null}
        {evaluation.issue ? (
          <span className="confirm-issue">
            <CurrencyText text={t(evaluation.issue)} />
          </span>
        ) : null}
      </div>
      <div className="confirm-buttons">
        <button type="button" className="pad-button pad-cancel" aria-label={t('pad.cancel')} onClick={cancelTool}>
          ✗
        </button>
        <button type="button" className="pad-button" aria-label={t('pad.rotate')} disabled={!canRotate} onClick={rotate}>
          ⟳
        </button>
        <button type="button" className="pad-button pad-confirm" aria-label={t('pad.confirm')} disabled={!canConfirm} onClick={() => confirm()}>
          ✓
        </button>
      </div>
    </div>
  );
}
