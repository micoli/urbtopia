import type { ReactNode } from 'react';
import { CloseButton } from './CloseButton';

interface PanelHeaderProps {
    title: string|ReactNode;
    subtitle?: ReactNode;
    onClose: () => void;
}

export function PanelHeader({ title, subtitle, onClose }: PanelHeaderProps) {
    return (
        <header className="side-panel-header">
            <h2>
                {title}
                <span className="side-panel-header__tier">
                    &nbsp;{subtitle}
                </span>
            </h2>
            <div className="side-panel-header__actions">
                <CloseButton onClick={onClose} />
            </div>
        </header>
    );
}
