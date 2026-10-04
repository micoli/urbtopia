import { levelFactsOf } from '../../codex/levelFacts';
import type { CodexId } from '../../codex/catalog';
import { t } from '../../i18n/t';

interface LevelFactsProps {
  id: CodexId;
  level: number;
}

export function LevelFacts({ id, level }: LevelFactsProps) {
  const facts = levelFactsOf(id, level);
  if (facts.length === 0) return null;
  return (
    <dl className="codex-level-facts">
      {facts.map(fact => (
        <div key={fact.label}>
          <dt>{t(fact.label)}</dt>
          <dd>{fact.value}{fact.change && <span className="codex-level-gain">{fact.change}</span>}</dd>
        </div>
      ))}
    </dl>
  );
}
