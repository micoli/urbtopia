import { ReachToggle } from '../common/ReachToggle.tsx';
import { CASINO_GAMES, CASINO, MAX_CASINO_TIER, casinoRadius, gamesOfTier, isCasinoPowered, maxStake, type Building } from '../../core';
import { t } from '../../i18n/t';
import { useGame, useUi } from '../common/hooks';
import { UpgradeSection } from '../common/UpgradeSection.tsx';
import { UrbsAmount } from '../common/UrbsAmount';

import { casinoGameIconUrl } from './casinoGameIcons';
import { launchCasinoGame } from './launchCasinoGame';
import {DrawerProductionPanel} from "../common/DrawerProductionPanel.tsx";
import {DrawerPanelTitle} from "../common/DrawerPanelTitle.tsx";
import {DrawerPanelLabelValue} from "../common/DrawerPanelLabelValue.tsx";
import { ActionButton } from '../common/ActionButton';

const PLAYABLE = new Set(['slotMachine', 'blackjack', 'blockmatch']);

interface CasinoPanelProps {
  building: Building;
}

export function CasinoPanel({ building }: CasinoPanelProps) {
  const state = useGame(store => store.state);
  const select = useUi(store => store.select);
  const powered = isCasinoPowered(state, building);
  const unlocked = building.tier < MAX_CASINO_TIER ? gamesOfTier(building.tier + 1).filter(game => !gamesOfTier(building.tier).includes(game)) : [];
  return <DrawerProductionPanel>
      <DrawerPanelTitle title={t('home.tier')} level={building.tier}/>
      <p className="stat-tight" data-state={powered ? 'on' : 'off'}>{powered ? t('casino.powered') : t('casino.shut')}</p>
      <DrawerPanelLabelValue label={t('facility.reach')} value={`${2 * casinoRadius(building.tier)} × ${2 * casinoRadius(building.tier)}`}/>
      <ReachToggle />
      <DrawerPanelLabelValue label={t('casino.maxStake')} value={<UrbsAmount value={maxStake(building.tier)} />}/>
      <div className="casino-games">
        {CASINO_GAMES.map(game => {
          const locked = CASINO.gameMinTier[game] > building.tier;
          return (
            <ActionButton variant="primary" block key={game} disabled={locked || !powered || !PLAYABLE.has(game)} onClick={() => launchCasinoGame(building.id, game, () => select(null))}>
              <img className="casino-game-icon" src={casinoGameIconUrl(game)} alt="" draggable={false} />
              <span>{t(`casino.${game}`)}{locked ? ` · ${t('home.tier')} ${CASINO.gameMinTier[game]}` : ''}</span>
            </ActionButton>
          );
        })}
      </div>
      <p className="stat-tight">{building.tier < MAX_CASINO_TIER ? `${t('casino.unlocksNext')}: ${unlocked.map(game => t(`casino.${game}`)).join(', ')} · ${t('casino.maxStake')} ${maxStake(building.tier + 1)}` : t('casino.maxTier')}</p>
      <UpgradeSection building={building} />
  </DrawerProductionPanel>
}
