import {climateStats, energyStats, transportStats} from '../../../core';
import {t} from '../../../i18n/t';
import {SectionHeading} from '../../common/SectionHeading';

interface EmissionsSectionProps {
    climate: ReturnType<typeof climateStats>;
    energy: ReturnType<typeof energyStats>;
    transport: ReturnType<typeof transportStats>;
}

export function EmissionsSection({climate, energy, transport}: EmissionsSectionProps) {
    return <section>
        <SectionHeading>{t('eco.emissions')}</SectionHeading>
        <p>
            {t('eco.activity')}: {climate.activityEmissions.toFixed(1)} · {t('eco.coal')}: {energy.coalEmissions.toFixed(1)} · {t('eco.backup')}: {energy.backupEmissions.toFixed(1)} · {t('eco.mobility')}: {transport.emissions.toFixed(1)}
        </p>
        <p>{t('eco.temperatureHelp')}</p>
    </section>;
}
