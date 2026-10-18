import {temperatureBreakdown, type CoolingElement, type HeatItem, type HeatSource} from '../../../core';
import {t} from '../../../i18n/t';
import {SectionHeading} from '../../common/SectionHeading';
import {LabeledList} from '../../common/LabeledList';
import {CoolingTable} from './temperature/CoolingTable';
import {HeatSourcesTable} from './temperature/HeatSourcesTable';
import type {MessageKey} from '../../../i18n/messages';

interface TemperatureSectionProps {
    breakdown: ReturnType<typeof temperatureBreakdown>;
    elements: CoolingElement[];
    items: Record<HeatSource, HeatItem[]>;
}

const TIPS: Record<HeatSource, MessageKey> = {
    activity: 'eco.tip.activity', coal: 'eco.tip.coal', backup: 'eco.tip.backup', transport: 'eco.tip.transport',
};

export function TemperatureSection({breakdown, elements, items}: TemperatureSectionProps) {
    return <section id="eco-temperature" className="eco-wide">
        <SectionHeading icon="🌡️">{t('eco.temperatureSection')}</SectionHeading>
        <p>{t('eco.temperatureHelp')}</p>
        <h4>{t('eco.heatSources')}</h4>
        <HeatSourcesTable sources={breakdown.sources} items={items} temperature={breakdown.temperature}/>
        <h4>{t('eco.coolingSources')}</h4>
        <LabeledList>
            <LabeledList.Row label={t('eco.cooling')}>{breakdown.cooling.toFixed(1)} / 100</LabeledList.Row>
            <LabeledList.Row label={t('eco.withoutGreen')}>{breakdown.uncooled.toFixed(1)} °C</LabeledList.Row>
            <LabeledList.Row label={t('eco.coolingReduction')}>−{breakdown.reduction.toFixed(1)} °C</LabeledList.Row>
            <LabeledList.Row label={t('eco.withGreen')}>{breakdown.temperature.toFixed(1)} °C</LabeledList.Row>
        </LabeledList>
        <CoolingTable elements={elements}/>
        <p>{t('eco.coolingItems')}</p>
        <p>{t('eco.coolingHomesOnly')}</p>
        <p>{t('eco.temperatureFloor')}</p>
        {breakdown.capped && <p>{t('eco.temperatureCapped')}</p>}
        {breakdown.adapting && <p>{t('eco.temperatureAdaptation')}</p>}
        {breakdown.optimal && <p>{t('eco.temperatureOptimal')}</p>}
        {breakdown.tips.map(source => <p key={source}>{t(TIPS[source])}</p>)}
        {breakdown.advisesGreen && <p>{t('eco.tip.green')}</p>}
    </section>;
}
