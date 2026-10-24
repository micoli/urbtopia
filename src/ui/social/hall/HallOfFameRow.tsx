import { t } from '../../../i18n/t';
import type { HallOfFameEntry } from '../../../showcase/types';
import { ActionButton } from '../../common/ActionButton';
import { HandleLabel } from '../HandleLabel';

interface HallOfFameRowProps {
    entry: HallOfFameEntry;
    busy: boolean;
    onVisit: () => void;
}

export function HallOfFameRow({entry, busy, onVisit}: HallOfFameRowProps) {
    return <li className="hall-row">
        <span className="hall-rank">{entry.rank}</span>
        <HandleLabel userId={entry.userId} handle={entry.handle} avatar={entry.avatar}/>
        <span className="hall-citizens">{t('hall.citizens').replace('{N}', String(entry.citizens))}</span>
        <ActionButton variant="primary" disabled={busy} onClick={onVisit}>{t('hall.visit')}</ActionButton>
    </li>;
}
