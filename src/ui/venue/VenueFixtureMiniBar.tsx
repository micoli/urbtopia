import type { MessageKey } from '../../i18n/messages';
import { t } from '../../i18n/t';
import { Icon } from '../common/Icon';
import { MiniBar } from '../layout/MiniBar';

interface VenueFixtureMiniBarProps {
  fixtureType: string;
  onExpand: () => void;
}

export function VenueFixtureMiniBar({ fixtureType, onExpand }: VenueFixtureMiniBarProps) {
  return <MiniBar icon={<Icon name="build" />} title={t(`venue.fixture.${fixtureType}` as MessageKey)} onExpand={onExpand} />;
}
