import { useContext } from 'react';
import { FIXTURE_PAGES } from '../../codex/fixturePages';
import { t } from '../../i18n/t';
import { FixtureLinkContext } from './fixtureLinkContext';

export function FixturesRules() {
  const linkOf = useContext(FixtureLinkContext);
  const pages = FIXTURE_PAGES.map(page => ({ page, name: t(`venue.fixture.${page.fixtures[0]!}`) })).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <>
      <h3 className="codex-entry-name">{t('codex.fixtures.title')}</h3>
      <p>{t('codex.fixtures.intro')}</p>
      <ul>
        {pages.map(({ page, name }) => {
          const link = linkOf(page.id);
          return <li key={page.id}><a href={link.href} onClick={link.onClick}>{name}</a></li>;
        })}
      </ul>
    </>
  );
}
