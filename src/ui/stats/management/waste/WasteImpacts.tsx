import type {WasteSituation} from '../../../../core';
import {t} from '../../../../i18n/t';
import {LabeledList} from '../../../common/LabeledList';

interface WasteImpactsProps {
    situation: WasteSituation;
    onShowEmissions: () => void;
}

export function WasteImpacts({situation, onShowEmissions}: WasteImpactsProps) {
    return <>
        <h4>{t('waste.impacts.title')}</h4>
        <LabeledList>
            <LabeledList.Row label={t('waste.impacts.odor')}>{situation.odorHomes}</LabeledList.Row>
            <LabeledList.Row label={t('waste.impacts.incinerator')}>{situation.incineratorHomes}</LabeledList.Row>
            <LabeledList.Row label={t('waste.impacts.emissions')}>{situation.incineratorEmissionsPerHour.toFixed(1)}</LabeledList.Row>
        </LabeledList>
        <button type="button" aria-controls="eco-emissions" onClick={onShowEmissions}>{t('waste.impacts.showEmissions')}</button>
    </>;
}
