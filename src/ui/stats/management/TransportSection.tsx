import {transportStats} from '../../../core';
import {t} from '../../../i18n/t';
import {SectionHeading} from '../../common/SectionHeading';
import {NetworkStatus} from './transit/NetworkStatus';
import {TransitTabs} from './transit/TransitTabs';

export function TransportSection({transport}: { transport: ReturnType<typeof transportStats> }) {
    return <section id="eco-transport" className="eco-wide">
        <SectionHeading icon="↔">{t('eco.transport')}</SectionHeading>
        <p>{t('eco.coverage')}: {transport.covered} · {t('eco.riders')}: {transport.riders.toFixed(1)} · {t('eco.cost')}: {transport.costPerHour}</p>
        <p>{t('eco.transportHelp')}</p>
        {transport.lines.some(l => l.active && !l.riders) && <p>{t('eco.adviceBus')}</p>}
        <NetworkStatus transport={transport}/>
        <TransitTabs transport={transport}/>
    </section>;
}
