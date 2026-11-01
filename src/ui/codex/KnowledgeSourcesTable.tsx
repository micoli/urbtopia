import type { KnowledgeCodexFigures } from '../../core';
import { t } from '../../i18n/t';

export function KnowledgeSourcesTable({ figures }: { figures: KnowledgeCodexFigures }) {
  return (
    <div className="codex-economy-scroll">
      <table className="codex-economy">
        <thead>
          <tr>
            <th scope="col">{t('codex.knowledge.source')}</th>
            <th scope="col">{t('codex.knowledge.points')}</th>
          </tr>
        </thead>
        <tbody>
          {figures.schooling.map(({ type, points }) => (
            <tr key={type}>
              <th scope="row">{t(`building.${type}`)}</th>
              <td>{points}</td>
            </tr>
          ))}
          {figures.library.map(({ tier, points }) => (
            <tr key={`library-${tier}`}>
              <th scope="row">{t('codex.knowledge.libraryTier').replace('{tier}', String(tier))}</th>
              <td>{points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
