import { useState } from 'react';
import { t } from '../../../i18n/t';
import { ActionButton } from '../../common/ActionButton';
import { InlineConfirm } from '../../common/InlineConfirm';
import type { MedalInfo } from '../../../challenges/types';
import { HandleLabel } from '../HandleLabel';
import { MedalList } from '../MedalList';
import { CountBadge } from '../../common/CountBadge';

interface FriendRowProps {
    userId: string;
    handle: string;
    avatar: string | null;
    unread: number;
    medals: MedalInfo[];
    onMessage: () => void;
    onTrade: () => void;
    onRemove: () => void;
    onBlock: () => void;
}

export function FriendRow({userId, handle, avatar, unread, medals, onMessage, onTrade, onRemove, onBlock}: FriendRowProps) {
    const [confirming, setConfirming] = useState<'remove' | 'block' | null>(null);
    const done = (run: () => void) => () => {
        setConfirming(null);
        run();
    };
    return <li className="friends-row">
        <HandleLabel userId={userId} handle={handle} avatar={avatar}/>
        <MedalList medals={medals}/>
        <ActionButton variant="primary" onClick={onMessage}>{t('friends.message')}<CountBadge count={unread} label={t('friends.unread')}/></ActionButton>
        <ActionButton onClick={onTrade}>{t('friends.trade')}</ActionButton>
        {confirming !== 'block' ? <InlineConfirm confirming={confirming === 'remove'} triggerLabel={t('friends.remove')} confirmLabel={t('friends.remove')}
            message={t('friends.removeConfirm').replace('{H}', handle)} onRequest={() => setConfirming('remove')} onCancel={() => setConfirming(null)} onConfirm={done(onRemove)}/> : null}
        {confirming !== 'remove' ? <InlineConfirm confirming={confirming === 'block'} triggerLabel={t('friends.block')} confirmLabel={t('friends.block')}
            message={t('friends.blockConfirm').replace('{H}', handle)} onRequest={() => setConfirming('block')} onCancel={() => setConfirming(null)} onConfirm={done(onBlock)}/> : null}
    </li>;
}
