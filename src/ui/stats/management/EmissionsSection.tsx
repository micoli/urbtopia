import {climateStats, energyStats, transportStats} from '../../../core';
import {t} from '../../../i18n/t';
import {SectionHeading} from '../../common/SectionHeading';
import {PieChart} from '../../common/PieChart';
import {MANAGEMENT_SECTIONS} from './managementSections';

interface EmissionsSectionProps {
    climate: ReturnType<typeof climateStats>;
    energy: ReturnType<typeof energyStats>;
    transport: ReturnType<typeof transportStats>;
}

export function EmissionsSection({climate, energy, transport}: EmissionsSectionProps) {
    return <section id="eco-emissions">
        <SectionHeading icon={MANAGEMENT_SECTIONS['eco-emissions'].icon}>{t('eco.emissions')}</SectionHeading>
        <PieChart label={t('eco.emissions')} slices={[
            {id: 'activity', label: t('eco.activity'), value: climate.activityEmissions, color: 'var(--color-series-orange)'},
            {id: 'coal', label: t('eco.coal'), value: energy.coalEmissions, color: 'var(--color-series-grey)'},
            {id: 'backup', label: t('eco.backup'), value: energy.backupEmissions, color: 'var(--color-series-red)'},
            {id: 'mobility', label: t('eco.mobility'), value: transport.emissions, color: 'var(--color-series-blue)'},
        ]}/>
    </section>;
}
