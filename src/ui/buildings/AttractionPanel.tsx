import { attractionRowOf, cityAttractiveness, isShowType, spendingFactor, type Building } from '../../core';
import { t } from '../../i18n/t';
import { DrawerPanel } from '../common/DrawerPanel';
import { FirstUseHint } from '../common/FirstUseHint';
import { UrbsAmount } from '../common/UrbsAmount';
import { useGame } from '../common/hooks';
import { GatheringResultNote } from '../tourism/GatheringResultNote';
import { GatheringStatus } from '../tourism/GatheringStatus';
import { TakingsMeter } from '../tourism/TakingsMeter';
import { TicketChoice } from '../tourism/TicketChoice';
import { TouristArrivals } from '../tourism/TouristArrivals';

interface AttractionPanelProps {
  building: Building;
}

export function AttractionPanel({ building }: AttractionPanelProps) {
  const state = useGame(store => store.state);
  const row = attractionRowOf(state, building);
  const gathering = building.attraction?.gathering;
  return (
    <DrawerPanel>
      <FirstUseHint id="tourism">{t('hint.tourism')}</FirstUseHint>
      <div className="tourism-kpis">
        <div><span>{t('attraction.tourists')}</span><strong>{Math.round(row.tourists)}</strong></div>
        <div><span>{t('attraction.earnings')}</span><strong><UrbsAmount value={row.perHour} /></strong></div>
      </div>
      <p className="tourism-label">{t('attraction.ticket')}</p>
      <TicketChoice building={building} attractiveness={cityAttractiveness(state)} spending={spendingFactor(state)} />
      <TakingsMeter row={row} />
      <TouristArrivals modes={row.modes} />
      {gathering && !isShowType(building.type) ? <GatheringStatus building={building} gathering={gathering} now={state.lastSeen} /> : null}
      {isShowType(building.type) ? null : <GatheringResultNote building={building} />}
    </DrawerPanel>
  );
}
