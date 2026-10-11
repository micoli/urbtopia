import { t } from '../../../../i18n/t';
import { HANDLE_CHANGE_DELAY_DAYS } from '../../../../social/limits';
import { useCloud, useSocial } from '../../../common/hooks';
import { SectionHeading } from '../../../common/SectionHeading';
import { FriendsPanel } from './FriendsPanel';

const DAY_MS = 86_400_000;

export function FriendsSection() {
    const account = useCloud(s => s.account);
    const emailLink = useCloud(s => s.emailLink);
    const sendEmailLink = useCloud(s => s.actions?.sendEmailLink);
    const status = useSocial(s => s.status);
    const profile = useSocial(s => s.profile);
    const handleForm = useSocial(s => s.handleForm);
    const actions = useSocial(s => s.actions);
    return <section id="eco-friends">
        <SectionHeading>{t('friends.title')}</SectionHeading>
        <FriendsPanel account={account} emailLink={emailLink} status={status} profile={profile} handleForm={handleForm}
                      now={Date.now()} changeDelayMs={HANDLE_CHANGE_DELAY_DAYS * DAY_MS}
                      onSendLink={email => void sendEmailLink?.(email)}
                      onSetHandle={handle => void actions?.setHandle(handle)}
                      onSetFindable={findable => void actions?.setFindable(findable)}/>
    </section>;
}
