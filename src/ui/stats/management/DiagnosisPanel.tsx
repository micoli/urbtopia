import {ActionButton} from '../../common/ActionButton';
import type {AnalyticsLayerId, Diagnosis} from '../../../core';
import {causeText} from '../../../i18n/causeText';
import {t} from '../../../i18n/t';
import {useUi} from '../../common/hooks';
import {useStore} from 'zustand';
import {advisorStore} from '../../../advisor/advisorStore';
import {explainCauseQuestion} from '../../../advisor/advisorRequest';
import {useFeatureFlag} from '../../../featureFlags/useFeatureFlag';
import {prefsStore} from '../../../i18n/prefsStore';

// With a layer, the button opens it in the Analytics view and shows the Cause's spot there, instead of only pointing at the spot.
export function DiagnosisPanel({diagnosis, layer}: { diagnosis: Diagnosis; layer?: AnalyticsLayerId }) {
    const showTile = useUi(store => store.showTile);
    const enterAnalytics = useUi(store => store.enterAnalytics);
    const flag = useFeatureFlag('advisor');
    const enabled = useStore(prefsStore, store => store.advisor);
    if (diagnosis.causes.length === 0) return null;
    return <div className="diagnosis">
        <h4>{t('diagnosis.title')}</h4>
        <ul>
            {diagnosis.causes.map(cause => <li key={cause.key}>
                {causeText(cause)}
                {cause.focus[0] && !layer && <>{' '}<ActionButton size="xs" onClick={() => showTile(cause.focus[0]!)}>{t('diagnosis.showOnMap')}</ActionButton></>}
                {layer && <>{' '}<ActionButton size="xs" onClick={() => { enterAnalytics(layer); if (cause.focus[0]) showTile(cause.focus[0]); }}>{t('diagnosis.showLayer').replace('{layer}', t(`analytics.layer.${layer}`))}</ActionButton></>}
                {flag && enabled && <>{' '}<ActionButton size="xs" onClick={() => advisorStore.getState().openWindow(explainCauseQuestion(cause, prefsStore.getState().language))}>{t('advisor.explain')}</ActionButton></>}
            </li>)}
        </ul>
    </div>;
}
