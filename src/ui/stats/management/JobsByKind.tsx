import {jobsByKind, type CongestionStats, type GameState} from '../../../core';
import {t} from '../../../i18n/t';

interface JobsByKindProps {
    state: GameState;
    congestion: CongestionStats;
}

export function JobsByKind({state, congestion}: JobsByKindProps) {
    const rows = jobsByKind(state, congestion);
    if (rows.length === 0) return null;
    return <>
        <h4>{t('eco.jobsByKind')}</h4>
        <ul className="eco-jobs-list">
            {rows.map(({kind, offered, filled}) => <li key={kind}>
                <span>{t(`eco.jobsKind.${kind}`)}</span>
                <strong>{Math.round(filled)} / {offered}</strong>
            </li>)}
        </ul>
    </>;
}
