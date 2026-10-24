import { HANDLE_CHANGE_DELAY_DAYS } from '../../../social/limits';
import { useChallenges, useCloud, useShowcase, useSocial, useSolidarity, useUi } from '../../common/hooks';
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
    const solidarity = useSolidarity(s => s);
    const showcaseStatus = useShowcase(s => s.status);
    const showcaseActions = useShowcase(s => s.actions);
    const openSettings = useUi(s => s.openSettingsFromSocial);
    if (!account) return null;
    const displayedMedals = [...medals.filter(medal => medal.medalCode !== 'solidarity'), ...(solidarity.medal ? [solidarity.medal] : medals.filter(medal => medal.medalCode === 'solidarity'))];
    return <ProfilePanel account={account} cloudStatus={cloudStatus} status={status} profile={profile} handleForm={handleForm} medals={displayedMedals} donationValue={solidarity.value} pendingDonationValue={solidarity.pendingValue}
                         now={Date.now()} changeDelayMs={HANDLE_CHANGE_DELAY_DAYS * DAY_MS}
                         onManageAccount={() => openSettings(false)} hallOfFame={showcaseStatus && showcaseActions ? {optedOut: showcaseStatus.optedOut, onChange: optedOut => void showcaseActions.setOptOut(optedOut)} : undefined} actions={actions ?? NO_ACTIONS}/>;
}
