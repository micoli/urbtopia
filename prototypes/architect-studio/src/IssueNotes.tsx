import { t } from './i18n.ts';
import type { ArchitectMessageKey } from './messages.ts';
import { stats, type Plan } from './model.ts';

// Bottom of the 3D view, without a background, so the house stays visible behind.
export function IssueNotes({ plan }: { plan: Plan }) {
  const { issues } = stats(plan);
  if (issues.length === 0) return null;
  return (
    <ul className="studio-issues" role="status">
      {issues.map((issue) => (
        <li key={issue}>{t(`architect.issue.${issue}` as ArchitectMessageKey)}</li>
      ))}
    </ul>
  );
}
