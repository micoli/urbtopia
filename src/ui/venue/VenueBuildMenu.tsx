import { ARCADE_FIXTURE_IDS, ARCADE_FIXTURES } from '../../core';
import { t } from '../../i18n/t';
import { useStore } from 'zustand';
import { venueStore } from '../../store/venueStore';
import { useGame } from '../common/hooks';
import { UrbsAmount } from '../common/UrbsAmount';

export function VenueBuildMenu() {
  const selected = useStore(venueStore, store => store.selectedFixture);
  const select = useStore(venueStore, store => store.selectFixture);
  const urbs = useGame(store => store.state.urbs);
  return (
    <section className="venue-build" aria-label={t('venue.build')}>
      <h3>{t('venue.build')}</h3>
      <div className="venue-build__items">
        {ARCADE_FIXTURE_IDS.map(id => (
          <button
            key={id}
            type="button"
            className={`venue-fixture${selected === id ? ' venue-fixture--selected' : ''}`}
            aria-pressed={selected === id}
            disabled={urbs < ARCADE_FIXTURES[id].price}
            onClick={() => select(selected === id ? null : id)}
          >
            <span>{t(`venue.fixture.${id}`)}</span>
            <UrbsAmount value={ARCADE_FIXTURES[id].price} />
          </button>
        ))}
      </div>
      <p className="note note--muted">{selected ? t('venue.placeHint') : t('venue.chooseFixture')}</p>
    </section>
  );
}
