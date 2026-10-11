import { t } from '../../../../i18n/t';
import type { EmailLinkState } from '../../../../store/cloudStore';
import type { HandleFormState, SocialStatus } from '../../../../store/socialStore';
import type { CloudAccount } from '../../../../persistence/cloud/types';
import type { SocialState } from '../../../../social/types';
import { Note } from '../../../common/Note';
import { EmailLinkForm } from '../../../system/EmailLinkForm';
import { FindableToggle } from './FindableToggle';
import { HandleForm } from './HandleForm';

interface FriendsPanelProps {
    account: CloudAccount | null;
    emailLink: EmailLinkState;
    status: SocialStatus;
    profile: SocialState | null;
    handleForm: HandleFormState;
    now: number;
    changeDelayMs: number;
    onSendLink: (email: string) => void;
    onSetHandle: (handle: string) => void;
    onSetFindable: (findable: boolean) => void;
}

export function FriendsPanel({account, emailLink, status, profile, handleForm, now, changeDelayMs, onSendLink, onSetHandle, onSetFindable}: FriendsPanelProps) {
    if (!account) return <p>{t('friends.connecting')}</p>;
    if (!account.email) return <>
        <p>{t('friends.needEmail')}</p>
        <EmailLinkForm state={emailLink} onSend={onSendLink}/>
    </>;
    if (status === 'offline') return <Note>{t('friends.offline')}</Note>;
    if (status === 'no-handle') return <HandleForm current={null} changeWaitSeconds={0} state={handleForm} onSubmit={onSetHandle}/>;
    if (!profile) return <p>{t('friends.connecting')}</p>;
    const waitSeconds = Math.ceil((profile.handleChangedAt + changeDelayMs - now) / 1000);
    return <>
        <p>{t('friends.handle.current')}: <strong>{profile.handle}</strong></p>
        <HandleForm key={profile.handle} current={profile.handle} changeWaitSeconds={waitSeconds} state={handleForm} onSubmit={onSetHandle}/>
        <FindableToggle findable={profile.findable} onChange={onSetFindable}/>
    </>;
}
