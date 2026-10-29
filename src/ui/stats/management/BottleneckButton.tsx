import type {Coord} from '../../../core';
import {t} from '../../../i18n/t';
import {useUi} from '../../common/hooks';
import {ActionButton} from '../../common/ActionButton';

export function BottleneckButton({bottleneck}: { bottleneck: { tile: Coord } }) {
    const showTile = useUi(store => store.showTile);
    return <ActionButton size="sm" onClick={() => showTile(bottleneck.tile)}>{t('eco.showBottleneck')}</ActionButton>;
}
