import { DIFFICULTIES, ECOLOGY, SANCTIONS, difficultyOf, isAdapting, sanctionedHomes, type GameState } from '../../core';
import { t } from '../../i18n/t';
import { difficultyDescription } from '../common/difficultyDescription';
import { SanctionedHomesTable } from './SanctionedHomesTable';
import { SanctionsDifficultyTable } from './SanctionsDifficultyTable';

const sanctionsSomewhere = (factor: 'climate' | 'electricity') => DIFFICULTIES.some(difficulty => (SANCTIONS[difficulty].factors as readonly string[]).includes(factor));

interface SanctionsRulesProps {
  state: GameState;
}

export function SanctionsRules({ state }: SanctionsRulesProps) {
  const difficulty = difficultyOf(state);
  const adapting = isAdapting(state);
  const homes = sanctionedHomes(state);
  return (
    <>
      <h3 className="codex-entry-name">{t('codex.sanctions.title')}</h3>
      <p>{t('codex.sanctions.intro')}</p>
      <h4>{t('codex.sanctions.byDifficulty')}</h4>
      <SanctionsDifficultyTable current={difficulty} />
      {sanctionsSomewhere('electricity') && <p>{t('codex.sanctions.electricityNote')}</p>}
      {sanctionsSomewhere('climate') && <p>{t('codex.sanctions.climateNote')}</p>}
      <h4>{t('codex.sanctions.city')}</h4>
      <p><strong>{t('codex.sanctions.current').replace('{difficulty}', t(`difficulty.${difficulty}`))}</strong></p>
      <p>{difficultyDescription(difficulty)}</p>
      {adapting && difficulty !== 'cozy' && <p>{t('codex.sanctions.adapting').replace('{hours}', (((state.adaptationUntil ?? 0) - state.lastSeen) / ECOLOGY.hourMs).toFixed(1))}</p>}
      {difficulty === 'cozy' && <p>{t('codex.sanctions.cozyCity')}</p>}
      {difficulty !== 'cozy' && !adapting && homes.length === 0 && <p>{t('codex.sanctions.noHome')}</p>}
      {homes.length > 0 && (
        <>
          <h4>{t('codex.sanctions.homes')}</h4>
          <SanctionedHomesTable homes={homes} />
        </>
      )}
    </>
  );
}
