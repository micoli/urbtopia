import { t } from '../../../../i18n/t';
import { HANDLE_CHANGE_DELAY_DAYS } from '../../../../social/limits';
import { useCloud, useSocial } from '../../../common/hooks';
import { SectionHeading } from '../../../common/SectionHeading';
import { FriendsPanel } from './FriendsPanel';

const DAY_MS = 86_400_000;
const noop = async () => {};
const NO_ACTIONS = {setHandle: noop, setFindable: noop, sendRequest: noop, accept: noop, refuse: noop, remove: noop, block: noop, unblock: noop};

export function FriendsSection() {
    const account = useCloud(s => s.account);
    const emailCode = useCloud(s => s.emailCode);
    const cloudActions = useCloud(s => s.actions);
    const status = useSocial(s => s.status);
    const profile = useSocial(s => s.profile);
    const handleForm = useSocial(s => s.handleForm);
    const search = useSocial(s => s.search);
    const actionFailure = useSocial(s => s.actionFailure);
    const actions = useSocial(s => s.actions);
    return <section id="eco-friends">
        <SectionHeading>{t('friends.title')}</SectionHeading>
        <FriendsPanel account={account} emailCode={emailCode} status={status} profile={profile} handleForm={handleForm}
                      now={Date.now()} changeDelayMs={HANDLE_CHANGE_DELAY_DAYS * DAY_MS}
                      codeActions={{send: email => void cloudActions?.sendEmailCode(email), verify: code => void cloudActions?.verifyEmailCode(code), cancel: () => cloudActions?.cancelEmailCode()}}
                      search={search} actionFailure={actionFailure} actions={actions ?? NO_ACTIONS}/>
    </section>;
}
