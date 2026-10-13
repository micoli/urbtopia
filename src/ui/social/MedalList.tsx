import type { MedalInfo } from '../../challenges/types';
import { medalName } from '../../i18n/medalName';
import { t } from '../../i18n/t';

interface MedalListProps {
    medals: MedalInfo[];
    showEmpty?: boolean;
}

export function MedalList({medals, showEmpty = false}: MedalListProps) {
    if (medals.length === 0) return showEmpty ? <p className="note note--muted">{t('medal.none')}</p> : null;
    return <ul className="medal-list" aria-label={t('medal.title')}>
        {medals.map(medal => <li key={`${medal.medalCode}-${medal.earnedAt}`} className="medal"><span aria-hidden="true">🏅</span> {medalName(medal)}</li>)}
    </ul>;
}
