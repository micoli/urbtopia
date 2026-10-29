import type { Building } from '../../core';
import { t } from '../../i18n/t';
import type { MessageKey } from '../../i18n/messages';

export function ClubTableTab({ building }: { building: Building }) {
  const club = building.club!;
  const championship = club.championship;
  if (!championship) return null;
  const rows = [{ name: club.name, points: championship.points, mine: true }, ...championship.opponents.map(opponent => ({ name: opponent.name, points: opponent.points, mine: false }))].sort((a, b) => b.points - a.points || Number(b.mine) - Number(a.mine));
  return (
    <>
      <table className="club-table" aria-label={t('club.tab.table')}>
        <thead><tr><th>{t('club.table.team')}</th><th>{t('club.table.points')}</th></tr></thead>
        <tbody>
          {rows.map(row => <tr key={row.name} className={row.mine ? 'club-table__mine' : undefined}><td>{row.name}</td><td>{row.points}</td></tr>)}
        </tbody>
      </table>
      <h3>{t('club.table.fixtures')}</h3>
      <ol className="club-fixtures">
        {championship.fixtures.map(fixture => (
          <li key={fixture.at}>
            {championship.opponents[fixture.opponent]?.name} · {fixture.result ? `${t(`club.result.${fixture.result}` as MessageKey)}${fixture.score ? ` ${fixture.score[0]}–${fixture.score[1]}` : ''}` : '–'}
          </li>
        ))}
      </ol>
    </>
  );
}
