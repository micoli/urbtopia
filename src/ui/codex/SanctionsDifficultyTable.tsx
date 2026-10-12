import { DIFFICULTIES, SANCTIONABLE_FACTOR_IDS, SANCTIONS, type Difficulty } from '../../core';
import type { MessageKey } from '../../i18n/messages';
import { t } from '../../i18n/t';

const percent = (share: number) => `${Math.round(share * 100)}%`;

export function SanctionsDifficultyTable({ current }: { current: Difficulty }) {
  const factors = SANCTIONABLE_FACTOR_IDS.filter(factor => DIFFICULTIES.some(difficulty => SANCTIONS[difficulty].factors.includes(factor)));
  return (
    <div className="codex-economy-scroll">
      <table className="codex-economy">
        <thead>
          <tr>
            <th scope="col">{t('codex.sanctions.factor')}</th>
            {DIFFICULTIES.map(difficulty => (
              <th key={difficulty} scope="col" aria-current={difficulty === current ? 'true' : undefined}>{t(`difficulty.${difficulty}`)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {factors.map(factor => (
            <tr key={factor}>
              <th scope="row">{t(`needs.factor.${factor}` as MessageKey)}</th>
              {DIFFICULTIES.map(difficulty => {
                const sanctioned = SANCTIONS[difficulty].factors.includes(factor);
                return <td key={difficulty} data-current={difficulty === current} aria-label={t(sanctioned ? 'codex.sanctions.sanctioned' : 'codex.sanctions.notSanctioned')}>{sanctioned ? '✓' : '—'}</td>;
              })}
            </tr>
          ))}
          <tr>
            <th scope="row">{t('codex.sanctions.taxFloor')}</th>
            {DIFFICULTIES.map(difficulty => (
              <td key={difficulty} data-current={difficulty === current}>{SANCTIONS[difficulty].factors.length === 0 ? t('codex.sanctions.noSanction') : percent(SANCTIONS[difficulty].taxFloor)}</td>
            ))}
          </tr>
          <tr>
            <th scope="row">{t('codex.sanctions.citizenLoss')}</th>
            {DIFFICULTIES.map(difficulty => (
              <td key={difficulty} data-current={difficulty === current}>{SANCTIONS[difficulty].citizenLossSeverity === 0 ? t('codex.sanctions.noCitizenLoss') : percent(SANCTIONS[difficulty].citizenLossSeverity)}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
