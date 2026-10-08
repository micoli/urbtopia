import { CASINO, CASINO_GAMES, MAX_CASINO_TIER, boatTier, isBoatOperating, maxStake, type Boat } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { useGame, useUi } from '../common/hooks';
import { ActionButton } from '../common/ActionButton';
import { Note } from '../common/Note';
import { UrbsAmount } from '../common/UrbsAmount';
import { casinoGameIconUrl } from '../casino/casinoGameIcons';
import { launchCasinoGame } from '../casino/launchCasinoGame';

interface CasinoBoatRowProps {
  boat: Boat;
}

export function CasinoBoatRow({ boat }: CasinoBoatRowProps) {
  const state = useGame((store) => store.state);
  const select = useUi((store) => store.select);
  const tier = boatTier(boat);
  const open = isBoatOperating(state, boat);
  const nextPrice = CASINO.upgradeCosts[tier + 1];
  return (
    <div className="casino-boat">
      <Note>{t('boat.casino')} · {t('home.tier')} {tier} · {open ? t('casino.powered') : t('casino.shut')} · {t('casino.maxStake')} <UrbsAmount value={maxStake(tier)} /></Note>
      <div className="casino-games">
        {CASINO_GAMES.map((game) => {
          const locked = CASINO.gameMinTier[game] > tier;
          return (
            <ActionButton variant="primary" block key={game} disabled={locked || !open} onClick={() => launchCasinoGame(boat.id, game, () => select(null))}>
              <img className="casino-game-icon" src={casinoGameIconUrl(game)} alt="" draggable={false} />
              <span>{t(`casino.${game}`)}{locked ? ` · ${t('home.tier')} ${CASINO.gameMinTier[game]}` : ''}</span>
            </ActionButton>
          );
        })}
      </div>
      {tier < MAX_CASINO_TIER && nextPrice !== undefined ? (
        <ActionButton disabled={state.urbs < nextPrice} onClick={() => gameStore.getState().send({ type: 'UpgradeBoat', id: boat.id })}>
          {t('marina.upgrade')} · <UrbsAmount value={nextPrice} />
        </ActionButton>
      ) : null}
    </div>
  );
}
