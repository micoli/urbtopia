import type {GameState, TourismAdvice} from '../../../core';
import {t} from '../../../i18n/t';
import {ActionButton} from '../../common/ActionButton';
import {CurrencyText} from '../../common/CurrencyText';
import {Icon} from '../../common/Icon';
import {useShowAttraction} from './useShowAttraction';

function messageOf(advice: TourismAdvice, state: GameState): string {
    if (advice.kind === 'collect') return advice.count === 1 ? t('tourism.advice.collect.one') : t('tourism.advice.collect').replace('{count}', `${advice.count}`);
    if (advice.kind === 'hotel') return t('tourism.advice.hotel');
    if (advice.kind === 'attractiveness') return advice.missing === 1 ? t('tourism.advice.attractiveness.one') : t('tourism.advice.attractiveness').replace('{count}', `${advice.missing}`);
    if (advice.kind === 'station') return advice.count === 1 ? t('tourism.advice.station.one') : t('tourism.advice.station').replace('{count}', `${advice.count}`);
    const type = state.buildings.find(building => building.id === advice.buildingId)?.type;
    return t('tourism.advice.show').replace('{building}', type ? t(`building.${type}`) : '').replace('{amount}', `${Math.round(advice.net)}`);
}

interface TourismAdviceListProps {
    advice: readonly TourismAdvice[];
    state: GameState;
}

export function TourismAdviceList({advice, state}: TourismAdviceListProps) {
    const show = useShowAttraction();
    if (advice.length === 0) return <p>{t('tourism.adviceNone')}</p>;
    return <ul className="tourism-list tourism-advice">
        {advice.map(item => <li key={item.kind}>
            <Icon name="sparkles"/>
            <span><CurrencyText text={messageOf(item, state)}/></span>
            {'buildingId' in item ? <ActionButton size="xs" onClick={() => show(item.buildingId)}>{t('tourism.see')}</ActionButton> : null}
        </li>)}
    </ul>;
}
