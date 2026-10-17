import { t } from '../../../i18n/t';
import type { CloudStatus } from '../../../persistence/cloud/cloudSync';
import type { CloudAccount } from '../../../persistence/cloud/types';
import type { SocialState } from '../../../social/types';
import type { HandleFormState, SocialActions, SocialStatus } from '../../../store/socialStore';
import type { MedalInfo } from '../../../challenges/types';
import { Note } from '../../common/Note';
import { HandleLabel } from '../HandleLabel';
import { MedalList } from '../MedalList';
import { SolidarityProgress } from '../SolidarityProgress';
import { AvatarPicker } from '../friends/AvatarPicker';
import { BlockedList } from '../friends/BlockedList';
import { FindableToggle } from '../friends/FindableToggle';
import { HandleForm } from '../friends/HandleForm';
import { AccountSummary } from './AccountSummary';

interface ProfilePanelProps {
    account: CloudAccount;
    cloudStatus: CloudStatus;
    status: SocialStatus;
    profile: SocialState | null;
    handleForm: HandleFormState;
    medals: MedalInfo[];
    donationValue?: number;
    pendingDonationValue?: number;
    now: number;
    changeDelayMs: number;
    onManageAccount: () => void;
    actions: Pick<SocialActions, 'setHandle' | 'setAvatar' | 'setFindable' | 'unblock'>;
}

export function ProfilePanel({account, cloudStatus, status, profile, handleForm, medals, donationValue = 0, pendingDonationValue = 0, now, changeDelayMs, onManageAccount, actions}: ProfilePanelProps) {
    const summary = account.email ? <AccountSummary email={account.email} status={cloudStatus} onManage={onManageAccount}/> : null;
    if (status === 'offline') return <><Note>{t('friends.offline')}</Note>{summary}</>;
    if (status === 'no-handle') return <>
        <HandleForm current={null} changeWaitSeconds={0} state={handleForm} onSubmit={handle => void actions.setHandle(handle)}/>
        {summary}
    </>;
    if (!profile) return <><p>{t('friends.connecting')}</p>{summary}</>;
    const waitSeconds = Math.ceil((profile.handleChangedAt + changeDelayMs - now) / 1000);
    return <>
        <p>{t('friends.handle.current')}: <HandleLabel userId={account.userId} handle={profile.handle} avatar={profile.avatar}/></p>
        <h4>{t('medal.title')}</h4>
        <MedalList medals={medals} showEmpty/>
        <SolidarityProgress value={donationValue} pendingValue={pendingDonationValue} />
        <AvatarPicker userId={account.userId} chosen={profile.avatar} onChoose={avatar => void actions.setAvatar(avatar)}/>
        <HandleForm key={profile.handle} current={profile.handle} changeWaitSeconds={waitSeconds} state={handleForm} onSubmit={handle => void actions.setHandle(handle)}/>
        <FindableToggle findable={profile.findable} onChange={findable => void actions.setFindable(findable)}/>
        <BlockedList blocked={profile.blocked} onUnblock={id => void actions.unblock(id)}/>
        {summary}
    </>;
}
