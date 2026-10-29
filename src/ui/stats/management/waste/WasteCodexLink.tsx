import {t} from '../../../../i18n/t';
import {useUi} from '../../../common/hooks';
import {ActionButton} from '../../../common/ActionButton';

export function WasteCodexLink() {
    const openCodex = useUi(store => store.openCodex);
    return <ActionButton size="sm" onClick={() => openCodex(undefined, 'waste')}>{t('waste.codex.open')}</ActionButton>;
}
