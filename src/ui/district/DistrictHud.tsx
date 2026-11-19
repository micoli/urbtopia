import { DISTRICT_PLAN, type DistrictRank } from '../../core';
import { t } from '../../i18n/t';
import type { DistrictView } from './useDistrictGame';

interface DistrictHudProps {
  view: DistrictView;
}

const rankText = (rank: DistrictRank | undefined): string => (rank ? t(`district.rank.${rank}`) : t('district.noRank'));

export function DistrictHud({ view }: DistrictHudProps) {
  const deckSize = view.game?.deckSize ?? 0;
  const thresholds = (['bronze', 'silver', 'gold'] as const).map(rank => `${t(`district.rank.${rank}`)} ${Math.ceil(DISTRICT_PLAN.rankScorePerHex[rank] * deckSize)}`).join(' · ');
  return (
    <div className="district-hud">
      <div className="district-hud__score">
        <span className="district-hud__label">{t('district.score')}</span>
        <strong>{view.score}</strong>
        {view.gain !== null ? <span className={`district-hud__gain${view.gain < 0 ? ' district-hud__gain--loss' : ''}`}>{view.gain >= 0 ? `+${view.gain}` : view.gain}</span> : null}
      </div>
      <div>
        <span className="district-hud__label">{t('district.rank')}</span>
        <strong>{rankText(view.rank)}</strong>
      </div>
      <div>
        <span className="district-hud__label">{t('district.hexesLeft')}</span>
        <strong>{view.hexesLeft}</strong>
      </div>
      <div>
        <span className="district-hud__label">{t('district.best')}</span>
        <strong>{view.bestScore === undefined ? '—' : `${view.bestScore} · ${rankText(view.bestRank)}`}</strong>
      </div>
      {deckSize > 0 ? <p className="district-hud__thresholds">{thresholds}</p> : null}
    </div>
  );
}
