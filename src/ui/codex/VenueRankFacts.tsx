import { venueRankFiguresOf } from '../../codex/venueRankFigures';
import type { CodexId } from '../../codex/catalog';
import { t } from '../../i18n/t';

export function VenueRankFacts({ id }: { id: CodexId }) {
  const figures = venueRankFiguresOf(id);
  if (figures.length === 0) return null;
  return (
    <>
      <h4>{t('codex.venueRanks.title')}</h4>
      <p>{t('codex.venueRanks.intro')}</p>
      <dl className="codex-venue-ranks">
        {figures.map(figure => (
          <div key={figure.rank}>
            <dt>{t('venue.rank')} {figure.rank}</dt>
            <dd>
              {figure.earnedAt === 0 ? t('codex.venueRanks.start') : t('codex.venueRanks.earned').replace('{amount}', String(figure.earnedAt))}
              {figure.eventsOpen ? ` ${t('codex.venueRanks.events')}` : ''}
              {figure.unlockedFixtures.length === 0 ? '' : ` ${t('codex.venueRanks.fixtures').replace('{fixtures}', figure.unlockedFixtures.map(fixtureId => t(`venue.fixture.${fixtureId}`)).join(', '))}`}
            </dd>
          </div>
        ))}
      </dl>
    </>
  );
}
