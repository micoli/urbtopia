import {ActionButton} from '../../common/ActionButton';
import type {Diagnosis} from '../../../core';
import {causeText} from '../../../i18n/causeText';
import {t} from '../../../i18n/t';
import {useUi} from '../../common/hooks';

export function DiagnosisPanel({diagnosis}: { diagnosis: Diagnosis }) {
    const showTile = useUi(store => store.showTile);
    if (diagnosis.causes.length === 0) return null;
    return <div className="diagnosis">
        <h4>{t('diagnosis.title')}</h4>
        <ul>
            {diagnosis.causes.map(cause => <li key={cause.key}>
                {causeText(cause)}
                {cause.focus[0] && <>{' '}<ActionButton size="xs" onClick={() => showTile(cause.focus[0]!)}>{t('diagnosis.showOnMap')}</ActionButton></>}
            </li>)}
        </ul>
    </div>;
}
