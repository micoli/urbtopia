import { t } from '../../i18n/t';
import { climateStats, totalCitizens } from '../../core';
import { useGame, useUi } from '../common/hooks';
import { UrbsSymbol } from '../common/UrbsSymbol';
import { GameClock } from './GameClock';

export function MinimalStats() {
  const toggleStats = useUi(s => s.toggleStats);
  const urbs = useGame((store) => store.state.urbs);
  const citizens = useGame((store) => totalCitizens(store.state));
  const temperature = useGame((store) => climateStats(store.state).temperature);
  return (
    <button type="button" className="minimal-stats" aria-label={t('eco.title')} onClick={toggleStats}>
      <GameClock />{' · '}
      <strong>{Math.floor(urbs)}</strong> <UrbsSymbol /> · 👥 {citizens}
      {' · '}<span className="city-temperature" title={t('eco.temperatureHelp')} aria-label={`${t('eco.temperature')}: ${temperature.toFixed(1)} °C`}><span aria-hidden="true">🌡️</span> {temperature.toFixed(1)} °C</span>
    </button>
  );
}
