import {interiorEconomyRows, type GameState} from '../../../core';
import {t} from '../../../i18n/t';
import {SectionHeading} from '../../common/SectionHeading';
import {InteriorsGroup} from './InteriorsGroup';
import {MANAGEMENT_SECTIONS} from './managementSections';

interface InteriorsSectionProps {
    state: GameState;
}

export function InteriorsSection({state}: InteriorsSectionProps) {
    const rows = interiorEconomyRows(state);
    return <section id="eco-interiors" className="eco-wide">
        <SectionHeading icon={MANAGEMENT_SECTIONS['eco-interiors'].icon}>{t('eco.interiors')}</SectionHeading>
        <p>{t('eco.interiorsHelp')}</p>
        {rows.length === 0 && <p>{t('eco.interiorsEmpty')}</p>}
        <InteriorsGroup kind="production" rows={rows.filter(row => row.kind === 'production')}/>
        <InteriorsGroup kind="venue" rows={rows.filter(row => row.kind === 'venue')}/>
        <InteriorsGroup kind="service" rows={rows.filter(row => row.kind === 'service')}/>
    </section>;
}
