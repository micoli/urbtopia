import {useMemo} from 'react';
import {nextAttractionType, tourismOverview, totalCitizens, type GameState} from '../../../core';
import {definitionOf} from '../../../core/buildings/buildingDefinitions';
import {t} from '../../../i18n/t';
import {gameStore} from '../../../store/gameStore';
import {ActionButton} from '../../common/ActionButton';
import {SectionHeading} from '../../common/SectionHeading';
import {UrbsAmount} from '../../common/UrbsAmount';
import {TourismAdviceList} from './TourismAdviceList';
import {TourismAttractionRow} from './TourismAttractionRow';
import {TourismEventRow} from './TourismEventRow';

function emptyMessage(state: GameState): string | null {
    const next = nextAttractionType(state);
    if (!next) return null;
    const unlock = definitionOf(next).unlockCitizens ?? 0;
    const name = t(`building.${next}`);
    if (unlock <= totalCitizens(state)) return t('tourism.empty').replace('{building}', name);
    return t('tourism.emptyLocked').replace('{building}', name).replace('{count}', `${unlock}`);
}

export function TourismSection({state}: { state: GameState }) {
    const overview = useMemo(() => tourismOverview(state), [state]);
    const collectAll = () => {
        for (const row of overview.attractions) if (row.takings >= 1) gameStore.getState().send({type: 'Collect', buildingId: row.building.id});
    };
    return <section id="eco-tourism" className="eco-wide">
        <SectionHeading icon="ticket">{t('tourism.title')}</SectionHeading>
        <p>{t('tourism.help')}</p>
        {overview.attractions.length === 0 ? <p>{emptyMessage(state)}</p> : <>
            <div className="tourism-overview">
                <div><span>{t('attraction.tourists')}</span><strong>{Math.round(overview.touristsPerDay)}</strong></div>
                <div><span>{t('attraction.earnings')}</span><strong><UrbsAmount value={overview.perHour}/></strong></div>
                <div><span>{t('tourism.toCollect')}</span><strong><UrbsAmount value={overview.toCollect}/></strong></div>
                <div><span>{t('tourism.attractiveness')}</span><strong>{Math.round(overview.attractiveness * 100)} %</strong><small>{t('tourism.places').replace('{count}', `${overview.places}`).replace('{goal}', `${overview.placesGoal}`)}</small></div>
                <div><span>{t('tourism.spending')}</span><strong>× {overview.spending.toFixed(1)}</strong><small>{t(overview.hotels > 0 ? 'tourism.withHotel' : 'tourism.withoutHotel')}</small></div>
            </div>
            <ActionButton variant="primary" disabled={overview.toCollect === 0} onClick={collectAll}>{t('tourism.collectAll')} · <UrbsAmount value={overview.toCollect}/></ActionButton>
            <h4>{t('tourism.advice')}</h4>
            <TourismAdviceList advice={overview.advice} state={state}/>
            {overview.gatherings.length > 0 && <>
                <h4>{t('tourism.events')}</h4>
                <ul className="tourism-list">{overview.gatherings.map(row => <TourismEventRow key={row.building.id} row={row} now={state.lastSeen}/>)}</ul>
            </>}
            <h4>{t('tourism.attractions')}</h4>
            <ul className="tourism-list">{overview.attractions.map(row => <TourismAttractionRow key={row.building.id} row={row}/>)}</ul>
        </>}
    </section>;
}
