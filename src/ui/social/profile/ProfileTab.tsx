import { HANDLE_CHANGE_DELAY_DAYS } from '../../../social/limits';
import { useChallenges, useCloud, useSocial, useUi } from '../../common/hooks';
import { ProfilePanel } from './ProfilePanel';

const DAY_MS = 86_400_000;
const noop = async () => {};
const NO_MEDALS: never[] = [];
const NO_ACTIONS = {setHandle: noop, setAvatar: noop, setFindable: noop, unblock: noop};

export function ProfileTab() {
    const account = useCloud(s => s.account);
    const cloudStatus = useCloud(s => s.status);
    const status = useSocial(s => s.status);
    const profile = useSocial(s => s.profile);
    const handleForm = useSocial(s => s.handleForm);
    const actions = useSocial(s => s.actions);
    const medals = useChallenges(s => s.snapshot?.medals ?? NO_MEDALS);
    const openSettings = useUi(s => s.openSettingsFromSocial);
    if (!account) return null;
    return <ProfilePanel account={account} cloudStatus={cloudStatus} status={status} profile={profile} handleForm={handleForm} medals={medals}
                         now={Date.now()} changeDelayMs={HANDLE_CHANGE_DELAY_DAYS * DAY_MS}
                         onManageAccount={() => openSettings(false)} actions={actions ?? NO_ACTIONS}/>;
}
