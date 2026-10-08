import { useId, useState } from 'react';
import { useStore } from 'zustand';
import { FIXTURE_CATEGORIES, fixtureIdsInCategory, type FixtureCategory, type VenueType } from '../../core';
import { t } from '../../i18n/t';
import { venueStore } from '../../store/venueStore';
import { AccordionSection } from '../common/AccordionSection';
import { VenueFixtureItem } from './VenueFixtureItem';

interface VenueBuildMenuProps {
  tier: number;
  venueType: VenueType;
}

// The same menu as the city: one section open at a time, with the items of the section as rows with a picture and a cost.
export function VenueBuildMenu({ tier, venueType }: VenueBuildMenuProps) {
  const selected = useStore(venueStore, store => store.selectedFixture);
  const select = useStore(venueStore, store => store.selectFixture);
  const choose = useStore(venueStore, store => store.chooseFixture);
  const categories = FIXTURE_CATEGORIES[venueType];
  const [opened, setOpened] = useState<FixtureCategory>(categories[0]!);
  const menuId = useId();
  const open = categories.includes(opened) ? opened : categories[0]!;
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
          lockWhenExpanded
          className="build-section"
          toggleClassName="build-section-toggle"
          contentClassName="build-section-items"
          onToggle={() => setOpened(category)}
        >
          {fixtureIdsInCategory(venueType, category).map(id => (
            <VenueFixtureItem key={id} id={id} tier={tier} selected={selected === id} onChoose={() => (selected === id ? select(null) : choose(id))} />
          ))}
        </AccordionSection>
      ))}
      <p className="note note--muted">{t('venue.chooseFixture')}</p>
    </section>
  );
}
