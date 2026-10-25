import { t } from '../../i18n/t';

const KINDS = ['building', 'material', 'good', 'sale'] as const;

export function ProductionChainsLegend() {
  return (
    <ul className="codex-chain-legend">
      {KINDS.map((kind) => <li key={kind} data-kind={kind}>{t(`codex.chains.kind.${kind}`)}</li>)}
    </ul>
  );
}
