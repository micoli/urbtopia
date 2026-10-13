import { useState } from 'react';
import { t } from '../../../i18n/t';
import type { GroupMember } from '../../../social/types';
import { InlineConfirm } from '../../common/InlineConfirm';
import { HandleLabel } from '../HandleLabel';

interface MemberRowProps {
    member: GroupMember;
    isCreator: boolean;
    isMe: boolean;
    canRemove: boolean;
    onRemove: () => void;
    onBlock: () => void;
}

export function MemberRow({member, isCreator, isMe, canRemove, onRemove, onBlock}: MemberRowProps) {
    const [confirming, setConfirming] = useState<'remove' | 'block' | null>(null);
    const done = (run: () => void) => () => {
        setConfirming(null);
        run();
    };
    return <li className="friends-row">
        <HandleLabel userId={member.userId} handle={member.handle} avatar={member.avatar}/>
        {isCreator ? <small>{t('groups.creator')}</small> : null}
        {isMe ? <small>{t('groups.you')}</small> : null}
        {!isMe && canRemove && confirming !== 'block' ? <InlineConfirm confirming={confirming === 'remove'} triggerLabel={t('groups.removeMember')} confirmLabel={t('groups.removeMember')}
            message={t('groups.removeMemberConfirm').replace('{H}', member.handle)} onRequest={() => setConfirming('remove')} onCancel={() => setConfirming(null)} onConfirm={done(onRemove)}/> : null}
        {!isMe && confirming !== 'remove' ? <InlineConfirm confirming={confirming === 'block'} triggerLabel={t('friends.block')} confirmLabel={t('friends.block')}
            message={t('friends.blockConfirm').replace('{H}', member.handle)} onRequest={() => setConfirming('block')} onCancel={() => setConfirming(null)} onConfirm={done(onBlock)}/> : null}
    </li>;
}
