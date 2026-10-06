import {modeShares, type CongestionStats} from '../../../core';
import {t} from '../../../i18n/t';

interface ModeMixProps {
    congestion: CongestionStats;
}

export function ModeMix({congestion}: ModeMixProps) {
    const shares = modeShares(congestion);
    return <p>
        {t('eco.carShare')}: {(shares.car * 100).toFixed(0)}% · {t('eco.transitShare')}: {(shares.transit * 100).toFixed(0)}% · {t('eco.walkShare')}: {(shares.walking * 100).toFixed(0)}%
    </p>;
}
