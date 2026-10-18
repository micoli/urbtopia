import type {CoolingElement} from '../../../../core';
import {t} from '../../../../i18n/t';
import type {MessageKey} from '../../../../i18n/messages';

interface CoolingTableProps {
    elements: CoolingElement[];
}

export function CoolingTable({elements}: CoolingTableProps) {
    if (elements.length === 0) return <p>{t('eco.coolingNone')}</p>;
    return <table className="eco-temperature-table">
        <thead>
        <tr>
            <th scope="col">{t('eco.col.element')}</th>
            <th scope="col">{t('eco.col.count')}</th>
            <th scope="col">{t('eco.col.radius')}</th>
            <th scope="col">{t('eco.col.coolingWeight')}</th>
            <th scope="col">{t('eco.col.share')}</th>
        </tr>
        </thead>
        <tbody>
        {elements.map(({type, count, radius, weight, share}) => <tr key={type}>
            <th scope="row">{t(`building.${type}` as MessageKey)}</th>
            <td>{count}</td>
            <td>{radius}</td>
            <td>{weight.toFixed(1)}</td>
            <td><span className="eco-share-bar" aria-hidden="true"><span style={{width: `${100 * share}%`}}/></span>{(100 * share).toFixed(0)} %</td>
        </tr>)}
        </tbody>
    </table>;
}
