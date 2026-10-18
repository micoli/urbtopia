import {useState} from 'react';
import type {HeatContribution, HeatItem, HeatSource} from '../../../../core';
import {t} from '../../../../i18n/t';
import type {MessageKey} from '../../../../i18n/messages';
import {HeatItemRow} from './HeatItemRow';

interface HeatSourceRowsProps {
    contribution: HeatContribution;
    items: HeatItem[];
    initiallyOpen: boolean;
}

const HEAT_LABELS: Record<HeatSource, MessageKey> = {
    activity: 'eco.heat.activity', coal: 'eco.heat.coal', backup: 'eco.heat.backup', transport: 'eco.heat.transport',
};

export function HeatSourceRows({contribution, items, initiallyOpen}: HeatSourceRowsProps) {
    const [open, setOpen] = useState(initiallyOpen && items.length > 0);
    const {source, impact, degrees, share} = contribution;
    return <tbody>
    <tr>
        <th scope="row">
            <button type="button" className="eco-heat-toggle" aria-expanded={open} disabled={items.length === 0} title={t('eco.heat.details')} onClick={() => setOpen(!open)}>
                <span aria-hidden="true">{open ? '▾' : '▸'}</span>
                <i className="eco-heat-swatch" data-source={source} aria-hidden="true"/>{t(HEAT_LABELS[source])}
            </button>
        </th>
        <td>{impact.toFixed(1)}</td>
        <td>+{degrees.toFixed(2)} °C</td>
        <td>{(100 * share).toFixed(0)} %</td>
    </tr>
    {open && items.map((item, index) => <HeatItemRow key={index} item={item}/>)}
    </tbody>;
}
