import { t } from '../../../i18n/t';
import { Note } from '../../common/Note';

interface FindableToggleProps {
    findable: boolean;
    onChange: (findable: boolean) => void;
}

export function FindableToggle({findable, onChange}: FindableToggleProps) {
    return <div className="friends-findable">
        <label>
            <input type="checkbox" checked={findable} onChange={event => onChange(event.target.checked)}/>
            {' '}{t('friends.findable')}
        </label>
        <Note tone="muted">{t('friends.findableHint')}</Note>
    </div>;
}
