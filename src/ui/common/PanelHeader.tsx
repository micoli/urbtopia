import type { ReactNode } from 'react';
import { CloseButton } from './CloseButton';

interface PanelHeaderProps {
    icon?: ReactNode;
    title: string|ReactNode;
    subtitle?: ReactNode;
    onClose: () => void;
}

export function PanelHeader({ icon, title, subtitle, onClose }: PanelHeaderProps) {
    return (
        <header className="side-panel-header">
            <h2>
                {icon}
                <span>
                    {title}
                    <span className="side-panel-header__tier">
                        &nbsp;{subtitle}
                    </span>
                </span>
            </h2>
            <div className="side-panel-header__actions">
                <CloseButton onClick={onClose} />
            </div>
        </header>
    );
}
