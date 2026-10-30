import {TICKETS, ticketOf, type AttractionRow} from '../../../core';
import {t} from '../../../i18n/t';
import {gameStore} from '../../../store/gameStore';
import {ActionButton} from '../../common/ActionButton';
import {ProgressBar} from '../../common/ProgressBar';
import {UrbsAmount} from '../../common/UrbsAmount';
import {useShowAttraction} from './useShowAttraction';

export function TourismAttractionRow({row}: { row: AttractionRow }) {
    const show = useShowAttraction();
    const due = Math.floor(row.takings);
    const {building} = row;
    return <li className="tourism-row">
        <button type="button" className="tourism-row-name" onClick={() => show(building.id)}>
            {t(`building.${building.type}`)}
            <small>{t('attraction.ticket')} <UrbsAmount value={TICKETS[ticketOf(building)]?.price ?? 0}/></small>
        </button>
        <span className="tourism-row-stat">{t('attraction.ticketTourists').replace('{count}', `${Math.round(row.tourists)}`)}</span>
        <span className="tourism-row-stat"><UrbsAmount value={row.perHour}/>{t('attraction.perHour')}</span>
        <ProgressBar value={row.takings} max={row.cap} label={t('attraction.takings')}/>
        <ActionButton size="xs" disabled={due === 0} onClick={() => gameStore.getState().send({type: 'Collect', buildingId: building.id})}>
            <UrbsAmount value={due}/>
        </ActionButton>
    </li>;
}
