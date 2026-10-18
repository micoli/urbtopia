import { DIFFICULTIES, SANCTIONS, type Difficulty } from '../../core';
import { t } from '../../i18n/t';

const percent = (share: number) => `${Math.round(share * 100)}%`;

export function WasteSanctionTable({ current }: { current: Difficulty }) {
  return (
    <div className="codex-economy-scroll">
      <table className="codex-economy">
        <thead>
          <tr>
            <th scope="col">{t('codex.waste.difficulty')}</th>
            <th scope="col">{t('codex.waste.sanctioned')}</th>
            <th scope="col">{t('codex.waste.taxFloor')}</th>
          </tr>
        </thead>
        <tbody>
          {DIFFICULTIES.map(difficulty => {
            const { factors, taxFloor } = SANCTIONS[difficulty];
            const sanctioned = factors.includes('waste');
            return (
              <tr key={difficulty} data-current={difficulty === current}>
                <th scope="row" aria-current={difficulty === current ? 'true' : undefined}>{t(`difficulty.${difficulty}`)}</th>
                <td aria-label={t(sanctioned ? 'codex.sanctions.sanctioned' : 'codex.sanctions.notSanctioned')}>{sanctioned ? '✓' : '—'}</td>
                <td>{sanctioned ? percent(taxFloor) : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
