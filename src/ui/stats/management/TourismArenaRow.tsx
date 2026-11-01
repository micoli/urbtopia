import {TICKETS, ticketOf, type AttractionRow} from '../../../core';
import {t} from '../../../i18n/t';
import {gameStore} from '../../../store/gameStore';
import {ActionButton} from '../../common/ActionButton';
import {UrbsAmount} from '../../common/UrbsAmount';
import {useShowAttraction} from './useShowAttraction';

export function TourismArenaRow({row}: { row: AttractionRow }) {
    const show = useShowAttraction();
    const due = Math.floor(row.takings);
    const {building, phase} = row;
    return <li className="tourism-row">
        <button type="button" className="tourism-row-name" onClick={() => show(building.id)}>
            {t(`building.${building.type}`)}
            <small>{t('attraction.ticket')} <UrbsAmount value={TICKETS[ticketOf(building)]?.price ?? 0}/></small>
        </button>
        <span className="tourism-row-stat">{phase ? t(`gathering.phase.${phase}`) : t('tourism.nothingOn')}</span>
        <ActionButton size="xs" disabled={due === 0} onClick={() => gameStore.getState().send({type: 'Collect', buildingId: building.id})}>
            <UrbsAmount value={due}/>
        </ActionButton>
    </li>;
}
