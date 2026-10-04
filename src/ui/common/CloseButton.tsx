import { t } from '../../i18n/t';
import { IconButton } from './IconButton';

interface CloseButtonProps {
    onClick: () => void;
    label?: string;
}

export function CloseButton({ onClick, label = t('panel.close') }: CloseButtonProps) {
    return (
        <IconButton className="panel-close" label={label} onClick={onClick}>
            ✕
        </IconButton>
    );
}
