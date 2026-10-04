import { CloseButton } from './CloseButton';

interface PanelHeaderProps {
    title: string;
    onClose: () => void;
}

export function PanelHeader({ title, onClose }: PanelHeaderProps) {
    return (
        <header className="side-panel-header">
            <h2>{title}</h2>
            <CloseButton onClick={onClose} />
        </header>
    );
}
