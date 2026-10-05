import {transportStats, type CongestionStats} from '../../../core';
import {t} from '../../../i18n/t';
import {SectionHeading} from '../../common/SectionHeading';

interface TrafficSectionProps {
    congestion: CongestionStats;
    transport: ReturnType<typeof transportStats>;
    onShowTransport: () => void;
}

export function TrafficSection({congestion, transport, onShowTransport}: TrafficSectionProps) {
    const travellers = congestion.commuters + transport.riders;
    const carShare = travellers > 0 ? congestion.commuters / travellers * 100 : 0;
    return <section id="eco-traffic">
        <SectionHeading icon="🚗">{t('eco.traffic')}</SectionHeading>
        <p>{t('eco.carShare')}: {carShare.toFixed(0)}% · {t('eco.transitShare')}: {(travellers > 0 ? 100 - carShare : 0).toFixed(0)}%</p>
        <p>{t('eco.commutersByCar')}: {congestion.commuters.toFixed(0)} · {t('eco.riders')}: {transport.riders.toFixed(0)}</p>
        <p>{t('eco.jobs')}: {congestion.jobs.toFixed(0)} · {t('eco.unemployed')}: {congestion.unemployed.toFixed(0)}</p>
        <p>{t('eco.congestion')}: {(congestion.index * 100).toFixed(0)}% · {t('eco.saturatedSections')}: {congestion.saturatedSections} · {t('eco.disconnectedSections')}: {congestion.disconnectedSections.length}</p>
        <p>{t('eco.congestionHelp')}</p>
        <p>{t('eco.trafficHelp')}</p>
        <button type="button" aria-controls="eco-transport" onClick={onShowTransport}>{t('eco.showTransport')}</button>
    </section>;
}
