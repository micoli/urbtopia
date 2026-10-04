import { t } from '../../i18n/t';

interface CloseButtonProps {
    onClick: () => void;
    label?: string;
}

export function CloseButton({ onClick, label = t('panel.close') }: CloseButtonProps) {
    return (
        <button type="button" className="panel-close" aria-label={label} onClick={onClick}>
            ✕
        </button>
    );
}
