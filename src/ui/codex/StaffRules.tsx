import { staffFigures } from '../../codex/staffFigures';
import { t } from '../../i18n/t';
import { StaffRoleFacts } from './StaffRoleFacts';

export function StaffRules() {
  return (
    <>
      <h3 className="codex-entry-name">{t('codex.staff.title')}</h3>
      <p>{t('codex.staff.intro')}</p>
      {staffFigures().map(figure => <StaffRoleFacts key={figure.role} figure={figure} />)}
    </>
  );
}
