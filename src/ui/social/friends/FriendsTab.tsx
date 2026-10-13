import { useSocial, useUi } from '../../common/hooks';
import { FriendsPanel } from './FriendsPanel';

const noop = async () => {};
const NO_ACTIONS = {sendRequest: noop, accept: noop, refuse: noop, remove: noop, block: noop, openConversation: noop, closeConversation: noop, sendMessage: noop, refreshConversation: noop};

export function FriendsTab() {
    const status = useSocial(s => s.status);
    const profile = useSocial(s => s.profile);
    const search = useSocial(s => s.search);
    const actionFailure = useSocial(s => s.actionFailure);
    const conversation = useSocial(s => s.conversation);
    const actions = useSocial(s => s.actions);
    const startTrade = useUi(s => s.startTrade);
    const setTab = useUi(s => s.setSocialTab);
    return <FriendsPanel status={status} profile={profile} search={search} actionFailure={actionFailure} conversation={conversation}
                         onOpenProfile={() => setTab('profile')} onTrade={startTrade} actions={actions ?? NO_ACTIONS}/>;
}
