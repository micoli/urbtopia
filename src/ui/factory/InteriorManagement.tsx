import { useMemo } from 'react';
import type { Building } from '../../core';
import { t } from '../../i18n/t';
import { InteriorFeatures } from './InteriorFeatures';
import { InteriorRecipes } from './InteriorRecipes';
import { InteriorRepairs } from './InteriorRepairs';
import { wornOf } from './worn';

interface InteriorManagementProps {
  factory: Building;
}

// The Management panel of an interior: the Repair everything button with what is worn, then the Recipes of a Bakery or what the interior does.
export function InteriorManagement({ factory }: InteriorManagementProps) {
  const repairs = useMemo(() => wornOf(factory), [factory]);
  return (
    <section className="venue-build" aria-label={t('venue.management')}>
      <div className="venue-build__items">
        {factory.type === 'bakery' ? <InteriorRecipes factory={factory} /> : <InteriorFeatures building={factory} />}
        <InteriorRepairs buildingId={factory.id} repairs={repairs} />
      </div>
    </section>
  );
}
