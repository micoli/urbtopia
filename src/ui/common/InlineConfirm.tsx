import { t } from '../../i18n/t';
import { ActionButton } from './ActionButton';
import type { ComponentProps } from 'react';

interface InlineConfirmProps {
    confirming: boolean;
    triggerLabel: string;
    confirmLabel: string;
    message?: string;
    size?: ComponentProps<typeof ActionButton>['size'];
    onRequest: () => void;
    onCancel: () => void;
    onConfirm: () => void;
}

export function InlineConfirm({ confirming, triggerLabel, confirmLabel, message, size, onRequest, onCancel, onConfirm }: InlineConfirmProps) {
    if (!confirming) return <ActionButton size={size} onClick={onRequest}>{triggerLabel}</ActionButton>;
    return (
        <>
            {message && <p>{message}</p>}
            <ActionButton size={size} onClick={onCancel}>{t('sale.no')}</ActionButton>
            <ActionButton variant="danger" size={size} onClick={onConfirm}>{confirmLabel}</ActionButton>
        </>
    );
}
