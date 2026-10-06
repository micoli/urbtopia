import {transportStats, type CongestionStats} from '../../../core';
import {t} from '../../../i18n/t';
import {SectionHeading} from '../../common/SectionHeading';
import {BottleneckButton} from './BottleneckButton';
import {ModeMix} from './ModeMix';
import {SlowedLines} from './SlowedLines';
import {WalkingSummary} from './WalkingSummary';

interface TrafficSectionProps {
    congestion: CongestionStats;
    transport: ReturnType<typeof transportStats>;
    onShowTransport: () => void;
}

export function TrafficSection({congestion, transport, onShowTransport}: TrafficSectionProps) {
    return <section id="eco-traffic">
        <SectionHeading icon="🚗">{t('eco.traffic')}</SectionHeading>
        <ModeMix congestion={congestion}/>
        <p>{t('eco.shiftedRiders')}: {congestion.shift.total.toFixed(0)}</p>
        <p>{t('eco.commutersByCar')}: {congestion.commuters.toFixed(0)} · {t('eco.riders')}: {transport.riders.toFixed(0)}</p>
        <WalkingSummary congestion={congestion}/>
        <SlowedLines count={congestion.slowedLines}/>
        <p>{t('eco.jobs')}: {congestion.jobs.toFixed(0)} · {t('eco.unemployed')}: {congestion.unemployed.toFixed(0)}</p>
        <p>{t('eco.congestion')}: {(congestion.index * 100).toFixed(0)}% · {t('eco.saturatedSections')}: {congestion.saturatedSections} · {t('eco.disconnectedSections')}: {congestion.disconnectedSections.length}</p>
        <p>{t('eco.congestionHelp')}</p>
        <p>{t('eco.trafficHelp')}</p>
        {congestion.worstBottleneck && <BottleneckButton bottleneck={congestion.worstBottleneck}/>}
        <button type="button" aria-controls="eco-transport" onClick={onShowTransport}>{t('eco.showTransport')}</button>
    </section>;
}
