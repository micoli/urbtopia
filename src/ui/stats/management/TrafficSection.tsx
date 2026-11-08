import {ActionButton} from '../../common/ActionButton';
import {useMemo} from 'react';
import {diagnoseCongestion, transportStats, type CongestionStats, type GameState} from '../../../core';
import {t} from '../../../i18n/t';
import {SectionHeading} from '../../common/SectionHeading';
import {BottleneckButton} from './BottleneckButton';
import {DiagnosisPanel} from './DiagnosisPanel';
import {ModeMix} from './ModeMix';
import {SlowedLines} from './SlowedLines';
import {WalkingSummary} from './WalkingSummary';
import {MANAGEMENT_SECTIONS} from './managementSections';

interface TrafficSectionProps {
    state: GameState;
    congestion: CongestionStats;
    transport: ReturnType<typeof transportStats>;
    onShowTransport: () => void;
    onShowJobs: () => void;
}

export function TrafficSection({state, congestion, transport, onShowTransport, onShowJobs}: TrafficSectionProps) {
    const diagnosis = useMemo(() => diagnoseCongestion(state, congestion, transport), [state, congestion, transport]);
    return <section id="eco-traffic">
        <SectionHeading icon={MANAGEMENT_SECTIONS['eco-traffic'].icon}>{t('eco.traffic')}</SectionHeading>
        <ModeMix congestion={congestion}/>
        <p>{t('eco.commutersByCar')}: {congestion.commuters.toFixed(0)} · {t('eco.riders')}: {transport.riders.toFixed(0)}</p>
        <WalkingSummary state={state} congestion={congestion}/>
        <SlowedLines count={congestion.slowedLines}/>
        <p>{t('eco.congestion')}: {(congestion.index * 100).toFixed(0)}% · {t('eco.saturatedSections')}: {congestion.saturatedSections} · {t('eco.disconnectedSections')}: {congestion.disconnectedSections.length}</p>
        <p>{t('eco.congestionHelp')}</p>
        <p>{t('eco.trafficHelp')}</p>
        <ActionButton size="sm" aria-controls="eco-jobs" onClick={onShowJobs}>{t('eco.showJobs')}</ActionButton>
        <DiagnosisPanel diagnosis={diagnosis}/>
        {congestion.worstBottleneck && <BottleneckButton bottleneck={congestion.worstBottleneck}/>}
        <ActionButton size="sm" aria-controls="eco-transport" onClick={onShowTransport}>{t('eco.showTransport')}</ActionButton>
    </section>;
}
