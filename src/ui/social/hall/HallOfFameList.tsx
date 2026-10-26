import { t } from '../../../i18n/t';
import type { HallOfFameEntry } from '../../../showcase/types';
import type { HallOfFameState, VisitFailure } from '../../../store/showcaseStore';
import { ActionButton } from '../../common/ActionButton';
import { Note } from '../../common/Note';
import { HallOfFameRow } from './HallOfFameRow';

interface HallOfFameListProps {
    state: HallOfFameState;
    entries: HallOfFameEntry[];
    visitBusy: boolean;
    visitFailure: VisitFailure | null;
    onVisit: (userId: string, cityId: string) => void;
    onRefresh: () => void;
}

export function HallOfFameList({state, entries, visitBusy, visitFailure, onVisit, onRefresh}: HallOfFameListProps) {
    return <section className="hall-of-fame">
        <h4>{t('hall.title')}</h4>
        <p>{t('hall.intro')}</p>
        {visitFailure ? <Note>{t(`visit.fail.${visitFailure}`)}</Note> : null}
        {state === 'offline' ? <Note>{t('hall.offline')}</Note> : null}
        {state === 'error' ? <Note>{t('hall.error')}</Note> : null}
        {state === 'loading' && entries.length === 0 ? <p>{t('hall.loading')}</p> : null}
        {state === 'ready' && entries.length === 0 ? <Note tone="muted">{t('hall.empty')}</Note> : null}
        {entries.length > 0 ? <ol className="hall-list">
            {entries.map(entry => <HallOfFameRow key={`${entry.userId}:${entry.cityId}`} entry={entry} busy={visitBusy} onVisit={() => onVisit(entry.userId, entry.cityId)}/>)}
        </ol> : null}
        <ActionButton onClick={onRefresh}>{t('hall.refresh')}</ActionButton>
    </section>;
}
