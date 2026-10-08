import { FIXTURES, type FixtureId } from '../../core';
import { t } from '../../i18n/t';
import { FlyoutItem } from '../layout/FlyoutItem';
import { UrbsAmount } from '../common/UrbsAmount';
import { useFixturePicture } from './useFixturePicture';

interface VenueFixtureItemProps {
  id: FixtureId;
  tier: number;
  selected: boolean;
  onChoose: () => void;
}

export function VenueFixtureItem({ id, tier, selected, onChoose }: VenueFixtureItemProps) {
  const picture = useFixturePicture(id);
  const { price, minTier } = FIXTURES[id];
  const locked = tier < minTier;
  return (
    <FlyoutItem
      label={t(`venue.fixture.${id}`)}
      badge={locked ? `${t('venue.tierNeeded')} ${minTier}` : undefined}
      cost={<UrbsAmount value={price} />}
      preview={picture}
      selected={selected}
      disabled={locked}
      onChoose={onChoose}
    />
  );
}
