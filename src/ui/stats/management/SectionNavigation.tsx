import {t} from '../../../i18n/t';
import type {MessageKey} from '../../../i18n/messages';

const SECTIONS: [string, string, MessageKey][] = [
    ['production', '▦', 'eco.production'], ['energy', '⚡', 'eco.energy'],
    ['nature', '♧', 'build.greenSpaces'], ['services', '✚', 'stats.services'], ['transport', '↔', 'eco.transport'],
];

interface SectionNavigationProps {
    onSelect: (id: string) => void;
}

export function SectionNavigation({onSelect}: SectionNavigationProps) {
    return <nav className="eco-navigation" aria-label={t('eco.title')}>
        {SECTIONS.map(([id, icon, label]) => <button type="button" key={id} onClick={() => onSelect(`eco-${id}`)}>
            <span aria-hidden="true">{icon}</span>{t(label)}
        </button>)}
    </nav>;
}
