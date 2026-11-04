import {ActionButton} from '../../common/ActionButton';
import type {Diagnosis} from '../../../core';
import {causeText} from '../../../i18n/causeText';
import {t} from '../../../i18n/t';
import {useUi} from '../../common/hooks';
import {useStore} from 'zustand';
import {advisorStore} from '../../../advisor/advisorStore';
import {explainCauseQuestion} from '../../../advisor/advisorRequest';
import {useFeatureFlag} from '../../../featureFlags/useFeatureFlag';
import {prefsStore} from '../../../i18n/prefsStore';

export function DiagnosisPanel({diagnosis}: { diagnosis: Diagnosis }) {
    const showTile = useUi(store => store.showTile);
    const flag = useFeatureFlag('advisor');
    const enabled = useStore(prefsStore, store => store.advisor);
    if (diagnosis.causes.length === 0) return null;
    return <div className="diagnosis">
        <h4>{t('diagnosis.title')}</h4>
        <ul>
            {diagnosis.causes.map(cause => <li key={cause.key}>
                {causeText(cause)}
                {cause.focus[0] && <>{' '}<ActionButton size="xs" onClick={() => showTile(cause.focus[0]!)}>{t('diagnosis.showOnMap')}</ActionButton></>}
                {flag && enabled && <>{' '}<ActionButton size="xs" onClick={() => advisorStore.getState().openWindow(explainCauseQuestion(cause, prefsStore.getState().language))}>{t('advisor.explain')}</ActionButton></>}
            </li>)}
        </ul>
    </div>;
}
