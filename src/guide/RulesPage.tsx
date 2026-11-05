import type { CodexPage } from '../codex/pages';
import { RulesContent } from '../ui/codex/RulesContent';

interface RulesPageProps {
  id: CodexPage;
}

export function RulesPage({ id }: RulesPageProps) {
  return (
    <article className="guide-rules max-w-4xl">
      <RulesContent id={id} />
    </article>
  );
}
