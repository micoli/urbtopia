import { useId } from 'react';
import { useStore } from 'zustand';
import { FIXTURE_CATEGORIES, fixtureIdsInCategory, fixtureLimitOf, type Building, type FixtureVenue } from '../../core';
import { t } from '../../i18n/t';
import { venueStore } from '../../store/venueStore';
import { AccordionSection } from '../common/AccordionSection';
import { VenueFixtureItem } from './VenueFixtureItem';

interface VenueBuildMenuProps {
  tier: number;
  rank: number;
  venueType: FixtureVenue;
  // The building whose interior is fitted out: some of its Fixtures are limited by its Slots.
  building?: Building;
}

// The same menu as the city: at most one section open at a time, with the items of the section as rows with a picture and a cost.
export function VenueBuildMenu({ tier, rank, venueType, building }: VenueBuildMenuProps) {
  const selected = useStore(venueStore, store => store.selectedFixture);
  const select = useStore(venueStore, store => store.selectFixture);
  const choose = useStore(venueStore, store => store.chooseFixture);
  const categories = FIXTURE_CATEGORIES[venueType];
  const stored = useStore(venueStore, store => store.openSection);
  const opened = stored === undefined ? categories[0]! : stored;
  const setOpened = useStore(venueStore, store => store.setOpenSection);
  const menuId = useId();
  const open = opened === null || categories.includes(opened) ? opened : categories[0]!;
  return (
    <section className="venue-build" aria-label={t('venue.build')}>
      <h3>{t('venue.build')}</h3>
      {categories.map(category => (
        <AccordionSection
          key={category}
          id={`${menuId}-${category}`}
          title={t(`venue.category.${category}`)}
          expanded={open === category}
          chevron
          className="build-section"
          toggleClassName="build-section-toggle"
          contentClassName="build-section-items"
          onToggle={() => setOpened(open === category ? null : category)}
        >
          {fixtureIdsInCategory(venueType, category).map(id => (
            <VenueFixtureItem key={id} id={id} tier={tier} rank={rank} selected={selected === id} limit={building ? fixtureLimitOf(building, id) : undefined} onChoose={() => (selected === id ? select(null) : choose(id))} />
          ))}
        </AccordionSection>
      ))}
      <p className="note note--muted">{t('venue.chooseFixture')}</p>
    </section>
  );
}
