import {ECOLOGY, type HeatContribution, type HeatItem, type HeatSource} from '../../../../core';
import {t} from '../../../../i18n/t';
import type {MessageKey} from '../../../../i18n/messages';
import {HeatSourceRows} from './HeatSourceRows';

interface HeatSourcesTableProps {
    sources: HeatContribution[];
    items: Record<HeatSource, HeatItem[]>;
    temperature: number;
}

const HEAT_LABELS: Record<HeatSource, MessageKey> = {
    activity: 'eco.heat.activity', coal: 'eco.heat.coal', backup: 'eco.heat.backup', transport: 'eco.heat.transport',
};
const RANGE = ECOLOGY.maxTemperature - ECOLOGY.optimalTemperature;

export function HeatSourcesTable({sources, items, temperature}: HeatSourcesTableProps) {
    const ranked = [...sources].sort((a, b) => b.degrees - a.degrees);
    const total = sources.reduce((sum, {degrees}) => sum + degrees, 0);
    return <>
        <div className="eco-heat-chart" role="img" aria-label={`${t('eco.temperature')}: ${temperature.toFixed(1)} °C`}>
            <div className="eco-heat-bar">
                {ranked.filter(({degrees}) => degrees > 0).map(({source, degrees}) => <span
                    key={source} data-source={source} style={{width: `${100 * degrees / RANGE}%`}} title={`${t(HEAT_LABELS[source])}: +${degrees.toFixed(2)} °C`}/>)}
            </div>
            <div className="eco-heat-scale"><span>{ECOLOGY.optimalTemperature} °C</span><span>{ECOLOGY.maxTemperature} °C</span></div>
        </div>
        <table className="eco-temperature-table">
            <thead>
            <tr>
                <th scope="col">{t('eco.col.source')}</th>
                <th scope="col">{t('eco.col.impact')}</th>
                <th scope="col">{t('eco.col.warming')}</th>
                <th scope="col">{t('eco.col.share')}</th>
            </tr>
            </thead>
            {ranked.map((contribution, index) => <HeatSourceRows key={contribution.source} contribution={contribution} items={items[contribution.source]} initiallyOpen={index === 0}/>)}
            <tfoot>
            <tr>
                <th scope="row">{t('eco.heatTotal')}</th>
                <td>{sources.reduce((sum, {impact}) => sum + impact, 0).toFixed(1)}</td>
                <td>+{total.toFixed(2)} °C</td>
                <td/>
            </tr>
            </tfoot>
        </table>
    </>;
}
