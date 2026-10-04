import { prefsStore } from '../../../src/i18n/prefsStore';
import { t } from '../../../src/i18n/t';
import { UrbsAmount } from '../../../src/ui/common/UrbsAmount';
import { useGame } from '../../../src/ui/common/hooks';
import { MAX_CASINO_TIER } from '../../../src/core';
import { SimLink } from './SimLink';
import { SIM_URBS } from './simCity';

interface SimBarProps {
  minTier: number;
  tier: number;
  onTier: (tier: number) => void;
  onReset: () => void;
}

export function SimBar({ minTier, tier, onTier, onReset }: SimBarProps) {
  const urbs = useGame(store => store.state.urbs);
  const language = prefsStore.getState().language;
  const tiers = Array.from({ length: MAX_CASINO_TIER - minTier + 1 }, (_, index) => minTier + index);
  return (
    <header className="sim-bar">
      <SimLink to="/">← Home</SimLink>
      <span>{t('casino.balance')}: <UrbsAmount value={urbs} /></span>
      <span role="group" aria-label="Tier">
        {tiers.map(value => <button key={value} type="button" aria-pressed={value === tier} onClick={() => onTier(value)}>T{value}</button>)}
      </span>
      <button type="button" onClick={onReset}>Reset {SIM_URBS} U</button>
      <button type="button" onClick={() => prefsStore.getState().setLanguage(language === 'fr' ? 'en' : 'fr')}>{language === 'fr' ? 'EN' : 'FR'}</button>
    </header>
  );
}
