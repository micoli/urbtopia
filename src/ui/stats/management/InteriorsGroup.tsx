import type {InteriorEconomyKind, InteriorEconomyRow} from '../../../core';
import type {MessageKey} from '../../../i18n/messages';
import {t} from '../../../i18n/t';
import {InteriorEconomyItem} from './InteriorEconomyItem';

interface GroupLayout {
    title: MessageKey;
    columns: MessageKey[];
}

const LAYOUTS: Record<InteriorEconomyKind, GroupLayout> = {
    venue: {title: 'eco.interiorsVenues', columns: ['eco.interiorWages', 'eco.interiorPower', 'eco.interiorIncome']},
    production: {title: 'eco.interiorsProduction', columns: ['eco.interiorWages', 'eco.interiorPower', 'eco.interiorEffects', 'interior.breaker']},
    service: {title: 'eco.interiorsService', columns: ['eco.interiorWages', 'eco.interiorQuality']},
};

interface InteriorsGroupProps {
    kind: InteriorEconomyKind;
    rows: InteriorEconomyRow[];
}

export function InteriorsGroup({kind, rows}: InteriorsGroupProps) {
    if (rows.length === 0) return null;
    const {title, columns} = LAYOUTS[kind];
    return <>
        <h4>{t(title)}</h4>
        <table>
            <thead>
            <tr>
                <th>{t('eco.interiorName')}</th>
                {columns.map(column => <th key={column}>{t(column)}</th>)}
                <th/>
            </tr>
            </thead>
            <tbody>
            {rows.map(row => <InteriorEconomyItem key={row.building.id} row={row}/>)}
            </tbody>
        </table>
    </>;
}
