import type {SectionLoad} from '../../../core';
import {t} from '../../../i18n/t';
import {useUi} from '../../common/hooks';

export function BottleneckButton({bottleneck}: { bottleneck: SectionLoad }) {
    const showTile = useUi(store => store.showTile);
    return <button type="button" onClick={() => showTile(bottleneck.tile)}>{t('eco.showBottleneck')}</button>;
}
