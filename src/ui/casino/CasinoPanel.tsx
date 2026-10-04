import { ReachToggle } from '../buildings/ReachToggle';
import { CASINO_GAMES, CASINO, MAX_CASINO_TIER, casinoRadius, gamesOfTier, isCasinoPowered, maxStake, type Building } from '../../core';
import { t } from '../../i18n/t';
import { useGame, useUi } from '../common/hooks';
import { UpgradeSection } from '../buildings/UpgradeSection';
import { UrbsAmount } from '../common/UrbsAmount';

import { casinoGameIconUrl } from './casinoGameIcons';
import { launchCasinoGame } from './launchCasinoGame';

const PLAYABLE = new Set(['slotMachine', 'blackjack', 'blockmatch']);

interface CasinoPanelProps {
  building: Building;
}

export function CasinoPanel({ building }: CasinoPanelProps) {
  const state = useGame(store => store.state);
  const select = useUi(store => store.select);
  const powered = isCasinoPowered(state, building);
  const unlocked = building.tier < MAX_CASINO_TIER ? gamesOfTier(building.tier + 1).filter(game => !gamesOfTier(building.tier).includes(game)) : [];
  return (
    <section className="production">
      <h3><strong>{t('home.tier')}</strong> {building.tier}</h3>
      <p className="stat-tight" data-state={powered ? 'on' : 'off'}>{powered ? t('casino.powered') : t('casino.shut')}</p>
      <p><strong>{t('facility.reach')}</strong>: {2 * casinoRadius(building.tier)} × {2 * casinoRadius(building.tier)}</p>
      <ReachToggle />
      <p><strong>{t('casino.maxStake')}</strong>: <UrbsAmount value={maxStake(building.tier)} /></p>
      <div className="casino-games">
        {CASINO_GAMES.map(game => {
          const locked = CASINO.gameMinTier[game] > building.tier;
          return (
            <button key={game} type="button" className="collect-button" disabled={locked || !powered || !PLAYABLE.has(game)} onClick={() => launchCasinoGame(building.id, game, () => select(null))}>
              <img className="casino-game-icon" src={casinoGameIconUrl(game)} alt="" draggable={false} />
              <span>{t(`casino.${game}`)}{locked ? ` · ${t('home.tier')} ${CASINO.gameMinTier[game]}` : ''}</span>
            </button>
          );
        })}
      </div>
      <p className="stat-tight">{building.tier < MAX_CASINO_TIER ? `${t('casino.unlocksNext')}: ${unlocked.map(game => t(`casino.${game}`)).join(', ')} · ${t('casino.maxStake')} ${maxStake(building.tier + 1)}` : t('casino.maxTier')}</p>
      <UpgradeSection building={building} />
    </section>
  );
}
