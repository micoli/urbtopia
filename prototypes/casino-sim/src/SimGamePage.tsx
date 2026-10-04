import { useEffect, useState } from 'react';
import { casinoStore } from '../../../src/store/casinoStore';
import { gameStore } from '../../../src/store/gameStore';
import { t } from '../../../src/i18n/t';
import { useGame } from '../../../src/ui/common/hooks';
import { CasinoGameView } from '../../../src/ui/casino/CasinoGameView';
import type { SimGame } from './games';
import { SimBar } from './SimBar';
import { SIM_CASINO_ID, simCity } from './simCity';

interface SimGamePageProps {
  entry: SimGame;
  initialTier: number;
}

export function SimGamePage({ entry, initialTier }: SimGamePageProps) {
  const [tier, setTier] = useState(Math.max(entry.minTier, initialTier));
  const [session, setSession] = useState(0);
  const casino = useGame(store => store.state.buildings.find(building => building.id === SIM_CASINO_ID && building.type === 'casino'));
  useEffect(() => {
    gameStore.getState().replaceState(simCity(tier));
    casinoStore.getState().play(SIM_CASINO_ID, entry.game);
  }, [entry.game, tier, session]);

  return (
    <main className="sim-page">
      <SimBar minTier={entry.minTier} tier={tier} onTier={setTier} onReset={() => setSession(value => value + 1)} />
      <div className="dialog casino-dialog sim-game">
        <h2>{t(`casino.${entry.game}`)}</h2>
        {casino ? <CasinoGameView key={`${tier}-${session}`} game={entry.game} casino={casino} /> : null}
      </div>
    </main>
  );
}
