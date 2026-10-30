import {artistById, gatheringPhaseEnd, type AttractionRow} from '../../../core';
import {t} from '../../../i18n/t';
import {Icon} from '../../common/Icon';
import {formatTimeLeft} from '../../common/formatDuration';
import {useShowAttraction} from './useShowAttraction';

interface TourismEventRowProps {
    row: AttractionRow;
    now: number;
}

export function TourismEventRow({row, now}: TourismEventRowProps) {
    const show = useShowAttraction();
    const {gathering, phase, building} = row;
    if (!gathering || !phase) return null;
    const artist = gathering.artist ? artistById(gathering.artist) : undefined;
    return <li className="tourism-row">
        <button type="button" className="tourism-row-name" onClick={() => show(building.id)}>
            <Icon name={gathering.kind === 'show' ? 'music' : 'trophy'}/> {t(`building.${building.type}`)}
            <small>{artist?.name ?? t(`gathering.kind.${gathering.kind}`)}</small>
        </button>
        <span className="tourism-row-stat">{t(`gathering.phase.${phase}`)}</span>
        <span className="tourism-row-stat">{t(`gathering.until.${phase}`).replace('{time}', formatTimeLeft(gatheringPhaseEnd(gathering, phase) - now))}</span>
    </li>;
}
