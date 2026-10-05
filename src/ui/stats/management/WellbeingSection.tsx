import {cityBenefits} from '../../../core';
import {t} from '../../../i18n/t';
import {SectionHeading} from '../../common/SectionHeading';

export function WellbeingSection({green}: { green: ReturnType<typeof cityBenefits> }) {
    return <section>
        <SectionHeading>{t('eco.wellbeing')}</SectionHeading>
        <p>{t('eco.coalPenalty')}: −{green.pollutionPenalty.toFixed(1)}</p>
        <p>{t('eco.coalPollutionHelp')}</p>
        <p>{t('eco.congestionPenalty')}: −{green.congestionPenalty.toFixed(1)}</p>
    </section>;
}
