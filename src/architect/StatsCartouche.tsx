import { Icon } from '../ui/common/Icon.tsx';
import { UrbsSymbol } from '../ui/common/UrbsSymbol.tsx';
import { t } from '../i18n/t';
import { stats, type Plan } from '../core/architect/housePlan.ts';

// The pill of the city stats of the main screen, laid out in a column: cost, citizens, openings, and a warning while the plan cannot be built.
export function StatsCartouche({ plan }: { plan: Plan }) {
  const st = stats(plan);
  return (
    <div className="minimal-stats studio-cartouche" role="status">
      <span title={t('architect.stat.cost')}>
        <strong>{st.cost}</strong> <UrbsSymbol />
      </span>
      <span title={t('architect.stat.citizens')}>
        <Icon name="citizens" /> {st.citizens}
      </span>
      <span title={t('architect.stat.openings')}>
        <Icon name="display" /> {st.openings}
      </span>
      {st.issues.length > 0 && (
        <span className="studio-cartouche__warning" title={t(`architect.issue.${st.issues[0]!}`)}>
          <Icon name="warning" /> {st.issues.length}
        </span>
      )}
    </div>
  );
}
