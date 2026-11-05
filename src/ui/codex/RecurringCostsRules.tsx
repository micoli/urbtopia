import { recurringCostGroups } from '../../codex/recurringCosts';
import { t } from '../../i18n/t';

export function RecurringCostsRules() {
  return (
    <>
      <h3 className="codex-entry-name">{t('codex.costs.title')}</h3>
      <p>{t('codex.costs.intro')}</p>
      {recurringCostGroups().map(group => (
        <section key={group.title}>
          <h4>{t(group.title)}</h4>
          <div className="codex-economy-scroll">
            <table className="codex-economy">
              <thead>
                <tr>
                  <th scope="col">{t('codex.cost.item')}</th>
                  <th scope="col">{t('codex.cost.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {group.rows.map(row => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    <td>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </>
  );
}
