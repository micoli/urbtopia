import type { KnowledgeCodexFigures, KnowledgeEffectId } from '../../core';
import { t } from '../../i18n/t';

const percent = (share: number) => `${(share * 100).toFixed(share === 0 ? 0 : 1)}%`;

const shown = (id: KnowledgeEffectId, value: number) => (id === 'wellbeing' ? `+${value.toFixed(value === 0 ? 0 : 1)}` : percent(value));

export function KnowledgeEffectsTable({ effects }: { effects: KnowledgeCodexFigures['effects'] }) {
  return (
    <div className="codex-economy-scroll">
      <table className="codex-economy">
        <thead>
          <tr>
            <th scope="col">{t('codex.knowledge.effect')}</th>
            <th scope="col">{t('codex.knowledge.maximum')}</th>
            <th scope="col">{t('codex.knowledge.current')}</th>
          </tr>
        </thead>
        <tbody>
          {effects.map(({ id, maximum, current }) => (
            <tr key={id}>
              <th scope="row">{t(`codex.knowledge.effect.${id}`)}</th>
              <td>{shown(id, maximum)}</td>
              <td>{shown(id, current)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
