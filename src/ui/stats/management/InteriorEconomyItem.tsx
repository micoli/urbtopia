import type {InteriorEconomyRow} from '../../../core';
import {itemName} from '../../../i18n/itemName';
import {t} from '../../../i18n/t';
import {gameStore} from '../../../store/gameStore';
import {ActionButton} from '../../common/ActionButton';
import {useGame, useUi} from '../../common/hooks';
import {SwitchField} from '../../common/SwitchField';
import {UrbsAmount} from '../../common/UrbsAmount';
import {formatPercent} from '../../factory/formatPercent';
import {interiorEffectsOf} from '../../factory/interiorEffectsOf';

interface InteriorEconomyItemProps {
    row: InteriorEconomyRow;
}

function BenefitCell({row}: InteriorEconomyItemProps) {
    if (row.kind === 'venue') return <td><UrbsAmount value={row.incomePerHour}/></td>;
    if (row.kind === 'service') return <td>{formatPercent(row.quality)}</td>;
    return <td>
        <div>{interiorEffectsOf(row.building).map(effect => `${t(effect.label)} ${effect.value}`).join(' · ')}</div>
        {row.workedItems.length > 0 && <small>{t('eco.interiorWorked')} {row.workedItems.map(itemName).join(', ')}</small>}
    </td>;
}

function BreakerCell({row}: InteriorEconomyItemProps) {
    const {building} = row;
    const breakerOff = useGame(store => store.state.buildings.find(candidate => candidate.id === building.id)?.breakerOff);
    return <td>
        <SwitchField ariaLabel={t('interior.breaker')} checked={!breakerOff} onChange={on => gameStore.getState().send({type: 'SetInteriorBreaker', buildingId: building.id, off: !on})}/>
    </td>;
}

export function InteriorEconomyItem({row}: InteriorEconomyItemProps) {
    const select = useUi(store => store.select);
    const showBuilding = useUi(store => store.showBuilding);
    const {building} = row;
    const show = () => {
        select(building.id);
        showBuilding(building.id);
    };
    return <tr>
        <td>{building.name ?? t(`building.${building.type}`)}</td>
        <td><UrbsAmount value={row.wagesPerHour}/></td>
        {row.kind !== 'service' && <td>{row.power.toFixed(1)}</td>}
        <BenefitCell row={row}/>
        {row.kind === 'production' && <BreakerCell row={row}/>}
        <td><ActionButton size="xs" onClick={show}>{t('eco.showWorkplace')}</ActionButton></td>
    </tr>;
}
