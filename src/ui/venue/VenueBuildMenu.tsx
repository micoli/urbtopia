import { FIXTURES, fixtureIdsOf, type VenueType } from '../../core';
import { t } from '../../i18n/t';
import { useStore } from 'zustand';
import { venueStore } from '../../store/venueStore';
import { useGame } from '../common/hooks';
import { UrbsAmount } from '../common/UrbsAmount';

interface VenueBuildMenuProps {
  tier: number;
  venueType: VenueType;
}

export function VenueBuildMenu({ tier, venueType }: VenueBuildMenuProps) {
  const selected = useStore(venueStore, store => store.selectedFixture);
  const select = useStore(venueStore, store => store.selectFixture);
  const urbs = useGame(store => store.state.urbs);
  return (
    <section className="venue-build" aria-label={t('venue.build')}>
      <h3>{t('venue.build')}</h3>
      <div className="venue-build__items">
        {fixtureIdsOf(venueType).map(id => {
          const { price, minTier } = FIXTURES[id];
          const locked = tier < minTier;
          return (
            <button
              key={id}
              type="button"
              className={`venue-fixture${selected === id ? ' venue-fixture--selected' : ''}`}
              aria-pressed={selected === id}
              disabled={locked || urbs < price}
              onClick={() => select(selected === id ? null : id)}
            >
              <span>{t(`venue.fixture.${id}`)}</span>
              {locked ? <span className="venue-fixture__lock">{t('venue.tierNeeded')} {minTier}</span> : <UrbsAmount value={price} />}
            </button>
          );
        })}
      </div>
      <p className="note note--muted">{selected ? t('venue.placeHint') : t('venue.chooseFixture')}</p>
    </section>
  );
}
