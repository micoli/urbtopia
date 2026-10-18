import {WASTE, type WasteSituation} from '../../../../core';
import {t} from '../../../../i18n/t';
import {LabeledList} from '../../../common/LabeledList';
import {UrbsAmount} from '../../../common/UrbsAmount';

export function WastePedestrian({situation}: {situation: WasteSituation}) {
    return <>
        <h4>{t('waste.pedestrian.title')}</h4>
        <LabeledList>
            <LabeledList.Row label={t('waste.pedestrian.homes')}>{situation.pedestrianHomes}</LabeledList.Row>
            <LabeledList.Row label={t('waste.pedestrian.surcharge')}><UrbsAmount value={situation.pedestrianSurcharge}/></LabeledList.Row>
        </LabeledList>
        <p>{t('waste.pedestrian.help').replace('{distance}', String(WASTE.carryingDistance)).replace('{factor}', String(WASTE.carriedSurcharge))}</p>
    </>;
}
