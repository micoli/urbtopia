import {t} from '../../../../i18n/t';
import {useUi} from '../../../common/hooks';

export function WasteCodexLink() {
    const openCodex = useUi(store => store.openCodex);
    return <button type="button" onClick={() => openCodex(undefined, 'waste')}>{t('waste.codex.open')}</button>;
}
