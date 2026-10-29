import { t } from '../../../i18n/t';
import { ActionButton } from '../../common/ActionButton';

interface HallOfFameNoticeViewProps {
    onKeep: () => void;
    onOptOut: () => void;
}

export function HallOfFameNoticeView({onKeep, onOptOut}: HallOfFameNoticeViewProps) {
    return <div className="reminder hall-notice" role="dialog" aria-labelledby="hall-notice-title">
        <strong id="hall-notice-title">{t('hall.notice.title')}</strong>
        <span>{t('hall.notice.text')}</span>
        <ActionButton size="sm" overlay variant="primary" onClick={onKeep}>{t('hall.notice.keep')}</ActionButton>
        <ActionButton size="sm" overlay onClick={onOptOut}>{t('hall.notice.optOut')}</ActionButton>
    </div>;
}
