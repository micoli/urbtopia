import type { InteriorRoleFigures } from '../../codex/interiorFigures';
import { t } from '../../i18n/t';

interface InteriorRolesTableProps {
  roles: readonly InteriorRoleFigures[];
}

export function InteriorRolesTable({ roles }: InteriorRolesTableProps) {
  return (
    <>
      <h5>{t('codex.interiors.staff')}</h5>
      <p>{t('codex.interiors.staffHelp')}</p>
      <div className="codex-economy-scroll">
        <table className="codex-economy">
          <thead>
            <tr>
              <th scope="col">{t('codex.interiors.role')}</th>
              <th scope="col">{t('codex.interiors.posts')}</th>
            </tr>
          </thead>
          <tbody>
            {roles.map(({ role, posts }) => (
              <tr key={role}>
                <th scope="row">{t(`interior.role.${role}`)}<br /><span className="note note--muted">{t(`interior.roleEffect.${role}`)}</span></th>
                <td>{posts.join(' · ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
