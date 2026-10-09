import { FIXTURES, type FixtureId } from '../../core';
import { t } from '../../i18n/t';
import { FlyoutItem } from '../layout/FlyoutItem';
import { UrbsAmount } from '../common/UrbsAmount';
import { useFixturePicture } from './useFixturePicture';

interface VenueFixtureItemProps {
  id: FixtureId;
  tier: number;
  rank: number;
  selected: boolean;
  onChoose: () => void;
}

export function VenueFixtureItem({ id, tier, rank, selected, onChoose }: VenueFixtureItemProps) {
  const picture = useFixturePicture(id);
  const { price, minTier, minRank = 1 } = FIXTURES[id];
  const lockedByTier = tier < minTier;
  const locked = lockedByTier || rank < minRank;
  return (
    <FlyoutItem
      label={t(`venue.fixture.${id}`)}
      badge={lockedByTier ? `${t('venue.tierNeeded')} ${minTier}` : locked ? `${t('venue.rankNeeded')} ${minRank}` : undefined}
      cost={<UrbsAmount value={price} />}
      preview={picture}
      selected={selected}
      disabled={locked}
      onChoose={onChoose}
    />
  );
}
