import { useShowcase, useSocial } from '../../common/hooks';
import { HallOfFameNoticeView } from './HallOfFameNoticeView';

export function HallOfFameNotice() {
    const status = useShowcase(s => s.status);
    const actions = useShowcase(s => s.actions);
    const member = useSocial(s => s.profile !== null);
    if (!member || !actions || !status || status.noticeSeen) return null;
    return <HallOfFameNoticeView onKeep={() => void actions.acknowledgeNotice()} onOptOut={() => void actions.setOptOut(true)}/>;
}
