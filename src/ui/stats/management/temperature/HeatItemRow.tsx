import {colorChoiceOf} from '../../../buildings/colorChoice';
import type {HeatItem} from '../../../../core';
import {t} from '../../../../i18n/t';
import type {MessageKey} from '../../../../i18n/messages';
import {useUi} from '../../../common/hooks';
import {ActionButton} from '../../../common/ActionButton';
import {MODE_LABEL} from '../transit/lineModels';

interface HeatItemRowProps {
    item: HeatItem;
}

function BuildingName({building}: { building: Extract<HeatItem, { kind: 'building' }>['building'] }) {
    const choice = colorChoiceOf(building.type, building.tier, building.colorVariant ?? 'default');
    return <>
        {t(`building.${building.type}` as MessageKey)}
        {choice && <> · <i className={choice.swatchClassName} style={choice.swatchColor ? {background: choice.swatchColor} : undefined} aria-hidden="true"/>{t(choice.label)}</>}
        {' '}· {t('panel.level')} {building.tier}
    </>;
}

export function HeatItemRow({item}: HeatItemRowProps) {
    const showBuilding = useUi(store => store.showBuilding);
    const target = item.kind === 'building' ? item.building : item.kind === 'line' ? item.stop : undefined;
    return <tr className="eco-heat-item">
        <th scope="row">
            {item.kind === 'building' && <BuildingName building={item.building}/>}
            {item.kind === 'line' && <>{t(MODE_LABEL[item.mode])} #{item.lineId}</>}
            {item.kind === 'citizens' && t('eco.heat.citizens')}
            {target && <ActionButton size="xs" onClick={() => showBuilding(target.id)}>{t('eco.showOnMap')}</ActionButton>}
        </th>
        <td>{item.impact.toFixed(2)}</td>
        <td>+{item.degrees.toFixed(2)} °C</td>
        <td/>
    </tr>;
}
