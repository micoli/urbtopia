import { FIXTURES, interiorLayoutOf, type Building, type MaterialId, type VenueFixture } from '../../core';
import { t } from '../../i18n/t';
import { formatPercent } from './formatPercent';

interface FarmFixtureStatusProps {
  farm: Building;
  fixture: VenueFixture;
  // Whether the Fixture is reached: by the Line for a Harvest bin, by the Flow for a Sprinkler.
  reached: boolean;
}

const fill = (text: string, values: Record<string, string | number>): string => Object.entries(values).reduce((out, [key, value]) => out.replace(`{${key}}`, String(value)), text);

// What a selected Harvest bin or Sprinkler of a Farm interior brings to the Farm: its bonus once its worker is assigned, the crop its farmhand harvests and how fast.
export function FarmFixtureStatus({ farm, fixture, reached }: FarmFixtureStatusProps) {
  const spec = FIXTURES[fixture.type];
  if (spec.assigns !== 'farmhand' && spec.assigns !== 'irrigator') return null;
  const farmhand = spec.assigns === 'farmhand';
  const share = formatPercent(farmhand ? spec.yield ?? 0 : spec.capacity ?? 0);
  const rate = interiorLayoutOf(farm.type)?.harvestPerHour?.[Math.min(farm.tier, interiorLayoutOf(farm.type)?.harvestPerHour?.length ?? 1) - 1] ?? 0;
  if (!fixture.assigned) return <p className="note note--warn">{t(farmhand ? 'farm.interior.binNoWorker' : 'farm.interior.sprinklerNoWorker')}</p>;
  return (
    <>
      {reached ? <p className="note">{fill(t(farmhand ? 'farm.interior.binYield' : 'farm.interior.sprinklerCap'), { share })}</p> : null}
      {farmhand ? <p className="note">{fixture.recipe === undefined ? t('farm.interior.binNoCrop') : fill(t('farm.interior.binHarvest'), { crop: t(`item.${fixture.recipe as unknown as MaterialId}`), rate })}</p> : null}
    </>
  );
}
