import { levelFactsOf } from '../../codex/levelFacts';
import type { CodexId } from '../../codex/catalog';
import { t } from '../../i18n/t';
import { LabeledList } from '../common/LabeledList';

interface LevelFactsProps {
  id: CodexId;
  level: number;
}

export function LevelFacts({ id, level }: LevelFactsProps) {
  const facts = levelFactsOf(id, level);
  if (facts.length === 0) return null;
  return (
    <LabeledList className="codex-level-facts">
      {facts.map(fact => (
        <LabeledList.Row key={fact.label} label={t(fact.label)}>
          {fact.value}{fact.change && <span className="codex-level-gain">{fact.change}</span>}
        </LabeledList.Row>
      ))}
    </LabeledList>
  );
}
