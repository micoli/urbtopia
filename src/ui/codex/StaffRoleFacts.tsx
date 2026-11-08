import type { StaffFigures } from '../../codex/staffFigures';
import { t } from '../../i18n/t';
import { LabeledList } from '../common/LabeledList';
import { UrbsAmount } from '../common/UrbsAmount';

const fill = (template: string, values: Record<string, string>): string =>
  Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), template);

interface StaffRoleFactsProps {
  figure: StaffFigures;
}

export function StaffRoleFacts({ figure }: StaffRoleFactsProps) {
  const venues = figure.venues.map(({ type, minTier }) => fill(t('codex.staff.venueTier'), { venue: t(`building.${type}`), tier: String(minTier) })).join(', ');
  return (
    <section aria-label={t(`venue.role.${figure.role}`)}>
      <h4>{t(`venue.role.${figure.role}`)}</h4>
      <LabeledList>
        <LabeledList.Row label={t('codex.staff.venues')}>{venues}</LabeledList.Row>
        <LabeledList.Row label={t('codex.staff.wage')}><UrbsAmount value={figure.dailyWage} /></LabeledList.Row>
        <LabeledList.Row label={t('codex.staff.hireFee')}><UrbsAmount value={figure.hireFee} /></LabeledList.Row>
      </LabeledList>
      <ul>
        {figure.effects.map(({ key, values }) => <li key={key}>{fill(t(key), values)}</li>)}
      </ul>
    </section>
  );
}
