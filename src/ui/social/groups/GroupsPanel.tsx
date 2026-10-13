import { useState } from 'react';
import { t } from '../../../i18n/t';
import type { Friend, Group } from '../../../social/types';
import type { ActionFailure, GroupActions, GroupConversationState, SocialStatus } from '../../../store/socialStore';
import { Note } from '../../common/Note';
import { GroupList } from './GroupList';
import { GroupView } from './GroupView';
import { NewGroupForm } from './NewGroupForm';
import { groupErrorMessage } from './groupErrorMessage';

interface GroupsPanelProps {
    status: SocialStatus;
    groups: Group[] | null;
    friends: Friend[];
    conversation: GroupConversationState | null;
    myUserId: string;
    busy: boolean;
    failure: ActionFailure | null;
    actions: GroupActions;
}

export function GroupsPanel({status, groups, friends, conversation, myUserId, busy, failure, actions}: GroupsPanelProps) {
    const [creating, setCreating] = useState(false);
    if (status === 'offline') return <Note>{t('friends.offline')}</Note>;
    if (status === 'no-handle') return <p>{t('friends.needHandle')}</p>;
    if (!groups) return <p>{t('friends.connecting')}</p>;
    const open = conversation ? groups.find(group => group.id === conversation.groupId) : undefined;
    if (conversation && open) return <GroupView key={open.id} group={open} conversation={conversation} friends={friends} myUserId={myUserId} busy={busy} failure={failure} actions={actions}/>;
    if (creating) return <>
        {failure ? <Note>{groupErrorMessage(failure.error, failure.retryAfterSeconds)}</Note> : null}
        <NewGroupForm friends={friends} busy={busy} onCancel={() => setCreating(false)} onCreate={(name, ids) => void actions.create(name, ids).then(created => created && setCreating(false))}/>
    </>;
    return <>
        {failure ? <Note>{groupErrorMessage(failure.error, failure.retryAfterSeconds)}</Note> : null}
        <GroupList groups={groups} hasFriends={friends.length > 0} onOpen={groupId => void actions.open(groupId)} onNew={() => setCreating(true)}/>
    </>;
}
