import { t } from '../../i18n/t';
import { ActionButton } from './ActionButton';

interface InlineConfirmProps {
    confirming: boolean;
    triggerLabel: string;
    confirmLabel: string;
    message?: string;
    onRequest: () => void;
    onCancel: () => void;
    onConfirm: () => void;
}

export function InlineConfirm({ confirming, triggerLabel, confirmLabel, message, onRequest, onCancel, onConfirm }: InlineConfirmProps) {
    if (!confirming) return <ActionButton onClick={onRequest}>{triggerLabel}</ActionButton>;
    return (
        <>
            {message && <p>{message}</p>}
            <ActionButton onClick={onCancel}>{t('sale.no')}</ActionButton>
            <ActionButton variant="danger" onClick={onConfirm}>{confirmLabel}</ActionButton>
        </>
    );
}
