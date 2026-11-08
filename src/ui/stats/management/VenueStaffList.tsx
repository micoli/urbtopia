import {venueStaffRows, type CongestionStats, type GameState} from '../../../core';
import {t} from '../../../i18n/t';
import {ActionButton} from '../../common/ActionButton';
import {useUi} from '../../common/hooks';

interface VenueStaffListProps {
    state: GameState;
    congestion: CongestionStats;
}

export function VenueStaffList({state, congestion}: VenueStaffListProps) {
    const showBuilding = useUi(store => store.showBuilding);
    const rows = venueStaffRows(state, congestion);
    if (rows.length === 0) return null;
    return <>
        <h4>{t('eco.venueStaff')}</h4>
        <p>{t('eco.venueStaffHelp')}</p>
        <ul className="eco-jobs-list">
            {rows.map(({building, hired, filled, posts}) => <li key={building.id}>
                <span>{building.name ?? t(`building.${building.type}`)}: {t('eco.venueStaffRow').replace('{hired}', String(hired)).replace('{filled}', String(Math.round(filled * 10) / 10)).replace('{posts}', String(posts)).replace('{rate}', String(Math.round((filled / hired) * 100)))}</span>
                <ActionButton size="xs" onClick={() => showBuilding(building.id)}>{t('eco.showWorkplace')}</ActionButton>
            </li>)}
        </ul>
    </>;
}
