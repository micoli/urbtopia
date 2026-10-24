import type { CodexPage } from '../../codex/pages';
import { RulesContent } from '../RulesContent';

interface LiveRulesProps {
  id: CodexPage;
}

export function LiveRules({ id }: LiveRulesProps) {
  return (
    <section className="guide-rules guide-live-rules">
      <RulesContent id={id} />
    </section>
  );
}
