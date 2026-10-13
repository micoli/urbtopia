import { t } from '../../../i18n/t';
import type { Friend } from '../../../social/types';
import { HandleLabel } from '../HandleLabel';

interface FriendPickerProps {
    friends: Friend[];
    chosen: string[];
    onToggle: (userId: string) => void;
}

export function FriendPicker({friends, chosen, onToggle}: FriendPickerProps) {
    if (friends.length === 0) return <p className="note note--muted">{t('groups.pickNone')}</p>;
    return <fieldset className="groups-picker">
        <legend>{t('groups.pick')}</legend>
        {friends.map(friend => <label key={friend.userId}>
            <input type="checkbox" checked={chosen.includes(friend.userId)} onChange={() => onToggle(friend.userId)}/>
            <HandleLabel userId={friend.userId} handle={friend.handle} avatar={friend.avatar}/>
        </label>)}
    </fieldset>;
}
