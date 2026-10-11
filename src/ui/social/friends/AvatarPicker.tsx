import { t } from '../../../i18n/t';
import { AVATAR_IDS, avatarOf } from '../../../social/avatar';
import { AvatarImage } from '../AvatarImage';

interface AvatarPickerProps {
    userId: string;
    chosen: string | null;
    onChoose: (avatar: string) => void;
}

export function AvatarPicker({userId, chosen, onChoose}: AvatarPickerProps) {
    const current = avatarOf(userId, chosen);
    return <fieldset className="avatar-picker">
        <legend>{t('friends.avatar.label')}</legend>
        {AVATAR_IDS.map((id, index) => <button key={id} type="button" className="avatar-option" aria-pressed={id === current} aria-label={t('friends.avatar.pick').replace('{N}', String(index + 1))} onClick={() => onChoose(id)}>
            <AvatarImage userId={userId} avatar={id}/>
        </button>)}
    </fieldset>;
}
