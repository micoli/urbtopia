import { t } from '../../../src/i18n/t';
import { SIM_GAMES } from './games';
import { SimLink } from './SimLink';
import { SIM_URBS } from './simCity';

export function SimHome() {
  return (
    <main className="sim-page">
      <h1>Casino simulator</h1>
      <p>{SIM_URBS} U to play with. Each Minigame is the same React component the Casino opens in the game.</p>
      <ul className="sim-games">
        {SIM_GAMES.map(({ game, path, minTier }) => (
          <li key={game}>
            <SimLink to={path}><strong>{t(`casino.${game}`)}</strong><small> · Tier {minTier}+ · {path}</small></SimLink>
          </li>
        ))}
      </ul>
    </main>
  );
}
