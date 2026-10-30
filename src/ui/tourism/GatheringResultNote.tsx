import { artistById, type Building } from '../../core';
import { t } from '../../i18n/t';
import { Icon } from '../common/Icon';
import { UrbsAmount } from '../common/UrbsAmount';

export function GatheringResultNote({ building }: { building: Building }) {
  const result = building.attraction?.lastGathering;
  if (!result) return null;
  const net = result.revenue - result.cost;
  const artist = result.artist ? artistById(result.artist) : undefined;
  return (
    <p className="gathering-result">
      <Icon name="trophy" />
      <span>
        {t('gathering.last')}{artist ? ` · ${artist.name}` : ''}<br />
        {t('gathering.lastCrowd').replace('{crowd}', `${Math.round(result.crowd)}`)} · <span data-net={net >= 0 ? 'gain' : 'loss'}>{net >= 0 ? '+' : '−'}<UrbsAmount value={Math.abs(net)} /></span>
      </span>
    </p>
  );
}
