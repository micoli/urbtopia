import { useState } from 'react';
import { t } from '../../../i18n/t';
import type { Friend, Group } from '../../../social/types';
import type { ActionFailure, GroupActions, GroupConversationState } from '../../../store/socialStore';
import { ActionButton } from '../../common/ActionButton';
import { InlineConfirm } from '../../common/InlineConfirm';
import { Note } from '../../common/Note';
import { MessageComposer } from '../friends/MessageComposer';
import { AddMembersForm } from './AddMembersForm';
import { GroupMessageList } from './GroupMessageList';
import { MemberRow } from './MemberRow';
import { RenameGroupForm } from './RenameGroupForm';
import { groupErrorMessage } from './groupErrorMessage';

type Section = 'messages' | 'members' | 'add' | 'rename';

interface GroupViewProps {
    group: Group;
    conversation: GroupConversationState;
    friends: Friend[];
    myUserId: string;
    busy: boolean;
    failure: ActionFailure | null;
    actions: Pick<GroupActions, 'close' | 'send' | 'refreshOpen' | 'rename' | 'addMembers' | 'removeMember' | 'blockMember' | 'leave' | 'remove'>;
}

const SECTIONS: Section[] = ['messages', 'members'];

export function GroupView({group, conversation, friends, myUserId, busy, failure, actions}: GroupViewProps) {
    const [section, setSection] = useState<Section>('messages');
    const [confirming, setConfirming] = useState(false);
    const isCreator = group.creatorId === myUserId;
    const candidates = friends.filter(friend => !group.members.some(member => member.userId === friend.userId));
    const sections: Section[] = isCreator ? [...SECTIONS, 'add', 'rename'] : SECTIONS;
    const shownFailure = failure ?? conversation.failure;
    return <div className="groups-view">
        <div className="friends-conversation-header">
            <ActionButton onClick={() => void actions.close()}>{t('friends.conversation.back')}</ActionButton>
            <h4>{group.name}</h4>
            <small>{t('groups.members').replace('{N}', String(group.members.length))}</small>
        </div>
        <div className="groups-menu" role="group" aria-label={group.name}>
            {sections.map(id => <ActionButton key={id} aria-pressed={section === id} onClick={() => setSection(id)}>{t(`groups.menu.${id}`)}</ActionButton>)}
            <InlineConfirm confirming={confirming} triggerLabel={t(isCreator ? 'groups.menu.delete' : 'groups.menu.leave')} confirmLabel={t(isCreator ? 'groups.menu.delete' : 'groups.menu.leave')}
                message={t(isCreator ? 'groups.deleteConfirm' : 'groups.leaveConfirm').replace('{G}', group.name)}
                onRequest={() => setConfirming(true)} onCancel={() => setConfirming(false)}
                onConfirm={() => void (isCreator ? actions.remove(group.id) : actions.leave(group.id))}/>
        </div>
        {shownFailure ? <Note>{groupErrorMessage(shownFailure.error, shownFailure.retryAfterSeconds)}</Note> : null}
        {section === 'messages' ? <>
            <GroupMessageList messages={conversation.messages} loading={conversation.loading}/>
            <MessageComposer sending={conversation.sending} onSend={body => void actions.send(body)} onRefresh={() => actions.refreshOpen()}/>
        </> : null}
        {section === 'members' ? <ul className="groups-members">
            {group.members.map(member => <MemberRow key={member.userId} member={member} isCreator={member.userId === group.creatorId} isMe={member.userId === myUserId} canRemove={isCreator}
                onRemove={() => void actions.removeMember(group.id, member.userId)} onBlock={() => void actions.blockMember(member.userId)}/>)}
        </ul> : null}
        {section === 'add' ? <AddMembersForm candidates={candidates} busy={busy} onAdd={ids => void actions.addMembers(group.id, ids).then(added => added && setSection('members'))}/> : null}
        {section === 'rename' ? <RenameGroupForm current={group.name} busy={busy} onRename={name => void actions.rename(group.id, name).then(renamed => renamed && setSection('messages'))}/> : null}
    </div>;
}
