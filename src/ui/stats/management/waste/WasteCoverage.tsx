import type {WasteSituation} from '../../../../core';
import type {MessageKey} from '../../../../i18n/messages';
import {t} from '../../../../i18n/t';
import {LabeledList} from '../../../common/LabeledList';

export function WasteCoverage({situation}: {situation: WasteSituation}) {
    const concerned = situation.causes.filter(entry => entry.homes > 0);
    return <>
        <h4>{t('waste.coverage.title')}</h4>
        <LabeledList>
            <LabeledList.Row label={t('waste.coverage.covered')}>{situation.coveredHomes}</LabeledList.Row>
            <LabeledList.Row label={t('waste.coverage.uncovered')}>{situation.uncoveredHomes}</LabeledList.Row>
        </LabeledList>
        {concerned.length === 0 ? <p>{t('waste.coverage.all')}</p> : <LabeledList>
            {concerned.map(entry => <LabeledList.Row key={entry.cause} label={t(`waste.cause.${entry.cause}` as MessageKey)}>
                {entry.homes} · {t('waste.coverage.citizens')}: {entry.citizens}
            </LabeledList.Row>)}
        </LabeledList>}
    </>;
}
