import type {WasteSituation} from '../../../../core';
import {t} from '../../../../i18n/t';
import {LabeledList} from '../../../common/LabeledList';
import {UrbsAmount} from '../../../common/UrbsAmount';

export function WasteBalance({situation}: {situation: WasteSituation}) {
    return <>
        <h4>{t('waste.balance.title')}</h4>
        <LabeledList>
            <LabeledList.Row label={t('waste.balance.produced')}>{situation.produced.toFixed(0)}</LabeledList.Row>
            <LabeledList.Row label={t('waste.balance.capacity')}>{situation.capacity.toFixed(0)}</LabeledList.Row>
            <LabeledList.Row label={t('waste.balance.processed')}>{situation.processed.toFixed(0)}</LabeledList.Row>
            <LabeledList.Row label={t('waste.balance.unprocessed')}>
                {situation.unprocessed.toFixed(0)} ({(situation.unprocessedShare * 100).toFixed(0)}%)
            </LabeledList.Row>
            <LabeledList.Row label={t('waste.balance.cost')}><UrbsAmount value={situation.costPerDay}/></LabeledList.Row>
        </LabeledList>
    </>;
}
