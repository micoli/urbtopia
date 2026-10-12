import type {NeedFactor} from '../../../../core';
import {t} from '../../../../i18n/t';
import type {MessageKey} from '../../../../i18n/messages';
import {formatSatisfaction, measureKey, satisfactionColor} from './needsFormat';
import {useUi} from '../../../common/hooks';

interface NeedsFactorRowProps {
    factor: NeedFactor;
    onShowSection: (id: string) => void;
}

export function NeedsFactorRow({factor, onShowSection}: NeedsFactorRowProps) {
    const modelled = factor.satisfaction !== null;
    const openCodex = useUi(store => store.openCodex);
    return <tr data-modelled={modelled}>
        <td>{factor.section
            ? <button type="button" onClick={() => onShowSection(factor.section!)}>{t(`needs.factor.${factor.id}` as MessageKey)}</button>
            : t(`needs.factor.${factor.id}` as MessageKey)}</td>
        <td>{t(`needs.by.${factor.id}` as MessageKey)}</td>
        <td>{modelled ? t(measureKey(factor.id)) : t('needs.notModelled')}</td>
        <td style={{color: satisfactionColor(factor.satisfaction)}}>{formatSatisfaction(factor.satisfaction)}</td>
        <td>{factor.effects.map((effect, index) => <span key={effect}>
            {index > 0 && ', '}
            {effect === 'sanction'
                ? <button type="button" onClick={() => openCodex(undefined, 'sanctions')}>{t('needs.effect.sanction')}</button>
                : t(`needs.effect.${effect}` as MessageKey)}
        </span>)}</td>
    </tr>;
}
