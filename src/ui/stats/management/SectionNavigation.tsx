import {t} from '../../../i18n/t';
import type {MessageKey} from '../../../i18n/messages';
import {CountBadge} from '../../common/CountBadge';
import {useSanctionedHomes} from '../../common/useSanctionedHomes';
import { Icon } from '../../common/Icon';
import type { IconName } from '../../common/iconRegistry';

const SECTIONS: [string, IconName, MessageKey][] = [
    ['production', 'production', 'eco.production'], ['energy', 'power', 'eco.energy'],
    ['needs', 'needs', 'needs.title'], ['nature', 'nature', 'build.greenSpaces'], ['waste', 'trash', 'waste.section.title'], ['services', 'services', 'stats.services'], ['temperature', 'temperature', 'eco.temperatureSection'], ['transport', 'transport', 'eco.transport'], ['transportMap', 'map', 'eco.transportMap'], ['traffic', 'car', 'eco.traffic'],
];

interface SectionNavigationProps {
    onSelect: (id: string) => void;
}

export function SectionNavigation({onSelect}: SectionNavigationProps) {
    const sanctionedCount = useSanctionedHomes().length;
    return <nav className="eco-navigation" aria-label={t('eco.title')}>
        {SECTIONS.map(([id, icon, label]) => <button type="button" key={id} onClick={() => onSelect(`eco-${id}`)}>
            <Icon name={icon} />{t(label)}
            {id === 'needs' && <CountBadge count={sanctionedCount} label={t('sanction.alert')}/>}
        </button>)}
    </nav>;
}
