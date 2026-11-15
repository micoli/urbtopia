import { interiorRowsOf } from '../../codex/fixtureFacts';
import type { FixturePage } from '../../codex/fixturePages';
import { t } from '../../i18n/t';
import { UrbsAmount } from '../common/UrbsAmount';

interface FixtureInteriorsTableProps {
  page: FixturePage;
}

export function FixtureInteriorsTable({ page }: FixtureInteriorsTableProps) {
  const rows = interiorRowsOf(page);
  return (
    <div className="codex-economy-scroll">
      <table className="codex-economy">
        <thead>
          <tr>
            <th>{t('codex.fixtures.interior')}</th>
            <th>{t('codex.fixtures.price')}</th>
            <th>{t('codex.fixtures.tier')}</th>
            <th>{t('codex.fixtures.rank')}</th>
            <th>{t('codex.fixtures.room')}</th>
            <th>{t('codex.fixtures.brings')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ id, spec, figures }) => (
            <tr key={id}>
              <th>{t(`building.${spec.venue}`)}</th>
              <td><UrbsAmount value={spec.price} /></td>
              <td>{spec.minTier}</td>
              <td>{spec.minRank ?? 1}</td>
              <td>{spec.footprint[0]} × {spec.footprint[1]}</td>
              <td>{figures.length === 0 ? t('codex.fixtures.nothing') : figures.map(({ key, value }) => `${t(key)} ${value}`).join(' · ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
