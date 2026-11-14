import { useMemo } from 'react';
import type { Building } from '../../core';
import { t } from '../../i18n/t';
import { InteriorExamples } from './InteriorExamples';
import { InteriorFeatures } from './InteriorFeatures';
import { InteriorIndicators } from './InteriorIndicators';
import { InteriorRecipes } from './InteriorRecipes';
import { InteriorRepairs } from './InteriorRepairs';
import { wornOf } from './worn';

interface InteriorManagementProps {
  factory: Building;
}

// The Management panel of an interior: its indicators, the Repair everything button with what is worn, then the Recipes of a Bakery or what the interior does.
export function InteriorManagement({ factory }: InteriorManagementProps) {
  const repairs = useMemo(() => wornOf(factory), [factory]);
  return (
    <section className="venue-build" aria-label={t('venue.management')}>
      <div className="venue-build__items">
        <InteriorIndicators factory={factory} />
        {factory.type === 'bakery' ? <InteriorRecipes factory={factory} /> : <InteriorFeatures building={factory} />}
        <InteriorExamples building={factory} />
        <InteriorRepairs buildingId={factory.id} repairs={repairs} />
      </div>
    </section>
  );
}
