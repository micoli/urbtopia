import {t} from '../../../i18n/t';
import type {MessageKey} from '../../../i18n/messages';
import { Icon } from '../../common/Icon';
import type { IconName } from '../../common/iconRegistry';

const SECTIONS: [string, IconName, MessageKey][] = [
    ['production', 'production', 'eco.production'], ['nature', 'nature', 'build.greenSpaces'], ['services', 'services', 'stats.services'], ['transportMap', 'map', 'eco.transportMap'],
];

interface SectionNavigationProps {
    onSelect: (id: string) => void;
}

export function SectionNavigation({onSelect}: SectionNavigationProps) {
    return <nav className="eco-navigation" aria-label={t('eco.title')}>
        {SECTIONS.map(([id, icon, label]) => <button type="button" key={id} onClick={() => onSelect(`eco-${id}`)}>
            <Icon name={icon} />{t(label)}
        </button>)}
    </nav>;
}
