import type { ReactNode } from 'react';
import { factsOf } from '../../codex/fixtureFacts';
import type { FixturePage } from '../../codex/fixturePages';
import { t } from '../../i18n/t';
import { FixtureInteriorsTable } from './FixtureInteriorsTable';
import { fixtureFactText } from './fixtureFactText';

interface FixturePageContentProps {
  page: FixturePage;
  // What only the game knows, such as the pieces of the player's city.
  live?: ReactNode;
}

export function FixturePageContent({ page, live }: FixturePageContentProps) {
  const facts = factsOf(page);
  const shared = facts.length === 1;
  const interiorsOf = (interiors: readonly string[]) => interiors.map(venue => t(`building.${venue}` as Parameters<typeof t>[0])).join(', ');
  return (
    <>
      <p className="codex-section-name">{t('codex.fixtures.title')}</p>
      <h3 className="codex-entry-name">{t(`venue.fixture.${page.fixtures[0]!}`)}</h3>
      {facts.map(({ interiors, description, usage }) => (
        <section key={interiors.join()}>
          {shared ? null : <p className="note note--muted">{t('codex.fixtures.in').replace('{interiors}', interiorsOf(interiors))}</p>}
          <h4>{t('codex.fixtures.what')}</h4>
          {description.map(line => <p key={line.key}>{fixtureFactText(line)}</p>)}
          <h4>{t('codex.fixtures.howTo')}</h4>
          <ul>{usage.map(line => <li key={line.key}>{fixtureFactText(line)}</li>)}</ul>
        </section>
      ))}
      <h4>{t('codex.fixtures.usedIn')}</h4>
      <FixtureInteriorsTable page={page} />
      {live}
    </>
  );
}
