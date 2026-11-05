import {modeShares, type CongestionStats} from '../../../core';
import {t} from '../../../i18n/t';
import {PieChart} from '../../common/PieChart';

interface ModeMixProps {
    congestion: CongestionStats;
}

export function ModeMix({congestion}: ModeMixProps) {
    const shares = modeShares(congestion);
    return <PieChart label={t('eco.modeMix')} showValues={false} slices={[
        {id: 'car', label: t('eco.carShare'), value: shares.car, color: 'var(--color-series-orange)'},
        {id: 'transit', label: t('eco.transitShare'), value: shares.transit, color: 'var(--color-series-blue)'},
        {id: 'walking', label: t('eco.walkShare'), value: shares.walking, color: 'var(--color-series-green)'},
        {id: 'cycling', label: t('eco.cycleShare'), value: shares.cycling, color: 'var(--color-series-grey)'},
    ]}/>;
}
