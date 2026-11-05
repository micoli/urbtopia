import type {WasteSituation} from '../../../../core';
import {t} from '../../../../i18n/t';
import {LabeledList} from '../../../common/LabeledList';
import {UrbsAmount} from '../../../common/UrbsAmount';

export function WasteRoutes({situation}: {situation: WasteSituation}) {
    return <>
        <h4>{t('waste.routes.title')}</h4>
        <LabeledList>
            <LabeledList.Row label={t('waste.routes.surcharge')}><UrbsAmount value={situation.distanceSurcharge}/></LabeledList.Row>
        </LabeledList>
        <p>{t('waste.routes.help')}</p>
    </>;
}
