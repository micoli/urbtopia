import { t } from '../../../../i18n/t.ts';
import { isSlowedByTraffic, speedPercent } from './lineSpeed.ts';
import type { LineSummary } from './LineMetrics.tsx';

export function LineSpeed({ line }: { line: LineSummary }) {
  return <>{speedPercent(line)}%{isSlowedByTraffic(line) && <> · {t('transit.slowedByTraffic')}</>}</>;
}
