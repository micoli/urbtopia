import {t} from '../../../i18n/t';
import type {MessageKey} from '../../../i18n/messages';
import {CountBadge} from '../../common/CountBadge';
import {useSanctionedHomes} from '../../common/useSanctionedHomes';

const SECTIONS: [string, string, MessageKey][] = [
    ['production', '▦', 'eco.production'], ['energy', '⚡', 'eco.energy'],
    ['needs', '▲', 'needs.title'], ['nature', '♧', 'build.greenSpaces'], ['waste', '🗑️', 'waste.section.title'], ['services', '✚', 'stats.services'], ['temperature', '🌡️', 'eco.temperatureSection'], ['transport', '↔', 'eco.transport'], ['transportMap', '🗺️', 'eco.transportMap'], ['traffic', '🚗', 'eco.traffic'],
];

interface SectionNavigationProps {
    onSelect: (id: string) => void;
}

export function SectionNavigation({onSelect}: SectionNavigationProps) {
    const sanctionedCount = useSanctionedHomes().length;
    return <nav className="eco-navigation" aria-label={t('eco.title')}>
        {SECTIONS.map(([id, icon, label]) => <button type="button" key={id} onClick={() => onSelect(`eco-${id}`)}>
            <span aria-hidden="true">{icon}</span>{t(label)}
            {id === 'needs' && <CountBadge count={sanctionedCount} label={t('sanction.alert')}/>}
        </button>)}
    </nav>;
}
