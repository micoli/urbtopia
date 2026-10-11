import { useState } from 'react';
import { t } from '../../../../i18n/t';
import { InlineConfirm } from '../../../common/InlineConfirm';

interface FriendRowProps {
    handle: string;
    onRemove: () => void;
    onBlock: () => void;
}

export function FriendRow({handle, onRemove, onBlock}: FriendRowProps) {
    const [confirming, setConfirming] = useState<'remove' | 'block' | null>(null);
    const done = (run: () => void) => () => {
        setConfirming(null);
        run();
    };
    return <li className="friends-row">
        <strong>{handle}</strong>
        {confirming !== 'block' ? <InlineConfirm confirming={confirming === 'remove'} triggerLabel={t('friends.remove')} confirmLabel={t('friends.remove')}
            message={t('friends.removeConfirm').replace('{H}', handle)} onRequest={() => setConfirming('remove')} onCancel={() => setConfirming(null)} onConfirm={done(onRemove)}/> : null}
        {confirming !== 'remove' ? <InlineConfirm confirming={confirming === 'block'} triggerLabel={t('friends.block')} confirmLabel={t('friends.block')}
            message={t('friends.blockConfirm').replace('{H}', handle)} onRequest={() => setConfirming('block')} onCancel={() => setConfirming(null)} onConfirm={done(onBlock)}/> : null}
    </li>;
}
