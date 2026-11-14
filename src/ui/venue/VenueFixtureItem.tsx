import { FIXTURES, type FixtureId, type FixtureLimit } from '../../core';
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
  limit?: FixtureLimit;
}

export function VenueFixtureItem({ id, tier, rank, selected, onChoose, limit }: VenueFixtureItemProps) {
  const picture = useFixturePicture(id);
  const { price, minTier, minRank = 1 } = FIXTURES[id];
  const lockedByTier = tier < minTier;
  const full = limit !== undefined && limit.count >= limit.max;
  const locked = lockedByTier || rank < minRank || full;
  return (
    <FlyoutItem
      label={t(`venue.fixture.${id}`)}
      badge={lockedByTier ? `${t('venue.tierNeeded')} ${minTier}` : rank < minRank ? `${t('venue.rankNeeded')} ${minRank}` : limit ? `${limit.count}/${limit.max}` : undefined}
      cost={<UrbsAmount value={price} />}
      preview={picture}
      selected={selected}
      disabled={locked}
      onChoose={onChoose}
    />
  );
}
