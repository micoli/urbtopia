import { t } from '../../../i18n/t';
import { Note } from '../../common/Note';

interface HallOfFameToggleProps {
    optedOut: boolean;
    onChange: (optedOut: boolean) => void;
}

export function HallOfFameToggle({optedOut, onChange}: HallOfFameToggleProps) {
    return <div className="friends-findable">
        <label>
            <input type="checkbox" checked={!optedOut} onChange={event => onChange(!event.target.checked)}/>
            {' '}{t('hall.optOut')}
        </label>
        <Note tone="muted">{t('hall.optOutHint')}</Note>
    </div>;
}
