import { t } from '../../i18n/t';
import type { MessageKey } from '../../i18n/messages';
import { isPathTool, type PathTool } from '../../tools/tools';
import { CurrencyText } from '../common/CurrencyText';
import { useUi } from '../common/hooks';
import { UrbsAmount } from '../common/UrbsAmount';
import { useConfirmKeys } from './useConfirmKeys';
import { IconButton } from '../common/IconButton';

const PATH_START_HINT: Record<PathTool['kind'], MessageKey> = { road: 'pad.roadStart', demolishRoad: 'pad.demolishStart', upgradeRoad: 'pad.upgradeStart' };

export function ConfirmPad() {
  const tool = useUi((store) => store.tool);
  const evaluation = useUi((store) => store.evaluation);
  const confirm = useUi((store) => store.confirm);
  const cancelTool = useUi((store) => store.cancelTool);
  const rotate = useUi((store) => store.rotate);
  const pathTool = isPathTool(tool);
  const isBrush = tool?.kind === 'brush';
  const needsStart = pathTool && tool.start === null;
  const canConfirm = Boolean(evaluation?.valid) || needsStart;
  const canRotate = pathTool ? tool.start !== null : evaluation?.rotation != null;
  useConfirmKeys({ active: Boolean(tool && evaluation), canConfirm, canRotate, onConfirm: confirm, onRotate: rotate, onCancel: cancelTool });
  if (!tool || !evaluation) return null;
  return (
    <div className="confirm-pad">
      <div className="confirm-info">
        {needsStart ? <span>{t(PATH_START_HINT[tool.kind])}</span> : null}
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
        <IconButton size="lg" tone="danger" label={t('pad.cancel')} onClick={cancelTool}>
          ✗
        </IconButton>
        {isBrush ? null : (
          <IconButton size="lg" tone="light" label={t('pad.rotate')} disabled={!canRotate} onClick={rotate}>
            ⟳
          </IconButton>
        )}
        {isBrush ? null : (
          <IconButton size="lg" tone="accent" label={t('pad.confirm')} disabled={!canConfirm} onClick={() => confirm()}>
            ✓
          </IconButton>
        )}
      </div>
    </div>
  );
}
