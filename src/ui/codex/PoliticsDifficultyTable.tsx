import { DIFFICULTIES, POLITICS, type Difficulty } from '../../core';
import type { MessageKey } from '../../i18n/messages';
import { t } from '../../i18n/t';

const RULES = ['active', 'demonstrations', 'election', 'approvalWeighsOnGrants', 'approvalWeighsOnCouncil'] as const;

const RULE_LABELS: Record<(typeof RULES)[number], MessageKey> = {
  active: 'codex.politics.rule.active',
  demonstrations: 'codex.politics.rule.demonstrations',
  election: 'codex.politics.rule.election',
  approvalWeighsOnGrants: 'codex.politics.rule.grants',
  approvalWeighsOnCouncil: 'codex.politics.rule.council',
};

export function PoliticsDifficultyTable({ current }: { current: Difficulty }) {
  return (
    <div className="codex-economy-scroll">
      <table className="codex-economy">
        <thead>
          <tr>
            <th scope="col">{t('codex.politics.rule')}</th>
            {DIFFICULTIES.map(difficulty => <th key={difficulty} scope="col" aria-current={difficulty === current ? 'true' : undefined}>{t(`difficulty.${difficulty}`)}</th>)}
          </tr>
        </thead>
        <tbody>
          {RULES.map(rule => (
            <tr key={rule}>
              <th scope="row">{t(RULE_LABELS[rule])}</th>
              {DIFFICULTIES.map(difficulty => {
                const enabled = POLITICS.difficulties[difficulty][rule];
                return <td key={difficulty} data-current={difficulty === current} aria-label={t(enabled ? 'codex.politics.rule.yes' : 'codex.politics.rule.no')}>{enabled ? '✓' : '—'}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
