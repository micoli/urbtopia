import { hasProductionInterior, type Building } from '../../core';
import { useFeatureFlag } from '../../featureFlags/useFeatureFlag';
import { t } from '../../i18n/t';
import { venueStore } from '../../store/venueStore';
import { ActionButton } from '../common/ActionButton';
import { Icon } from '../common/Icon';

interface InteriorButtonProps {
  building: Building;
}

// Opens the interior of a Factory, a Packhouse or a Mill in the same view as the interior of a Venue; the Mill's is behind the flag of the Production interiors.
export function InteriorButton({ building }: InteriorButtonProps) {
  const production = useFeatureFlag('productionInterior');
  if (!hasProductionInterior(building) || (building.type === 'mill' && !production)) return null;
  return (
    <ActionButton variant="primary" block onClick={() => venueStore.getState().open(building.id)}>
      <Icon name="build" /> {t('factory.interior.open')}
    </ActionButton>
  );
}
