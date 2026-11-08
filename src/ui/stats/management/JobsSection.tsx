import {diagnoseJobs, jobsByMode, jobsSummary, unfilledWorkplaces, type CongestionStats, type GameState} from '../../../core';
import {t} from '../../../i18n/t';
import {SectionHeading} from '../../common/SectionHeading';
import {useMemo} from 'react';
import {DiagnosisPanel} from './DiagnosisPanel';
import {JobsByKind} from './JobsByKind';
import {UnfilledJobsList} from './UnfilledJobsList';
import {VenueStaffList} from './VenueStaffList';
import {MANAGEMENT_SECTIONS} from './managementSections';

interface JobsSectionProps {
    state: GameState;
    congestion: CongestionStats;
}

export function JobsSection({state, congestion}: JobsSectionProps) {
    const summary = jobsSummary(state, congestion);
    const modes = jobsByMode(congestion);
    const diagnosis = useMemo(() => diagnoseJobs(state, congestion), [state, congestion]);
    return <section id="eco-jobs">
        <SectionHeading icon={MANAGEMENT_SECTIONS['eco-jobs'].icon}>{t('eco.jobsSection')}</SectionHeading>
        <p>{t('stat.citizens')}: <b>{summary.citizens}</b> · {t('eco.citizensAtWork')}: <b>{summary.filled.toFixed(0)}</b> · {t('eco.unemployed')}: <b>{summary.unemployed.toFixed(0)}</b>{summary.uncounted >= 1 && <> · {t('eco.uncountedJobless')}: <b>{summary.uncounted.toFixed(0)}</b></>}</p>
        {summary.uncounted >= 1 && <p>{t('eco.uncountedJoblessHelp')}</p>}
        <p>{t('eco.jobs')}: {summary.offered.toFixed(0)} · {t('eco.unfilledJobsTotal')}: {summary.unfilled.toFixed(0)}</p>
        <p>{t('eco.unemployedHelp')}</p>
        <DiagnosisPanel diagnosis={diagnosis} layer="data.jobs"/>
        <p>{t('panel.jobsModes').replace('{walking}', String(Math.round(modes.walking))).replace('{cycling}', String(Math.round(modes.cycling))).replace('{transit}', String(Math.round(modes.transit))).replace('{car}', String(Math.round(modes.car)))}</p>
        <JobsByKind state={state} congestion={congestion}/>
        <VenueStaffList state={state} congestion={congestion}/>
        <UnfilledJobsList workplaces={unfilledWorkplaces(state, congestion)}/>
    </section>;
}
