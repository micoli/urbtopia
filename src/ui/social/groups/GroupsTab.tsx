import { useCloud, useSocial } from '../../common/hooks';
import { GroupsPanel } from './GroupsPanel';

export function GroupsTab() {
    const account = useCloud(s => s.account);
    const status = useSocial(s => s.status);
    const groups = useSocial(s => s.groups);
    const profile = useSocial(s => s.profile);
    const conversation = useSocial(s => s.groupConversation);
    const busy = useSocial(s => s.groupBusy);
    const failure = useSocial(s => s.groupFailure);
    const actions = useSocial(s => s.groupActions);
    if (!account || !actions) return null;
    return <GroupsPanel status={status} groups={groups} friends={profile?.friends ?? []} conversation={conversation} myUserId={account.userId} busy={busy} failure={failure} actions={actions}/>;
}
