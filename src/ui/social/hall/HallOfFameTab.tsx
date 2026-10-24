import { useEffect } from 'react';
import { useCloud, useShowcase } from '../../common/hooks';
import { HallOfFameList } from './HallOfFameList';

const REFRESH_MS = 60_000;

export function HallOfFameTab() {
    const account = useCloud(s => s.account);
    const state = useShowcase(s => s.hallOfFame);
    const entries = useShowcase(s => s.entries);
    const visit = useShowcase(s => s.visit);
    const actions = useShowcase(s => s.actions);
    useEffect(() => {
        if (!actions) return;
        void actions.refreshHallOfFame();
        const timer = setInterval(() => {
            if (document.visibilityState === 'visible') void actions.refreshHallOfFame();
        }, REFRESH_MS);
        return () => clearInterval(timer);
    }, [actions]);
    if (!actions) return null;
    return <HallOfFameList state={state} entries={entries} ownUserId={account?.userId ?? null} visitBusy={visit.kind === 'loading'}
                           visitFailure={visit.kind === 'failed' ? visit.reason : null}
                           onVisit={userId => void actions.visit(userId)} onRefresh={() => void actions.refreshHallOfFame()}/>;
}
