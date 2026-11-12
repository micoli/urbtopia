import type { ReactNode } from 'react';
import { CloseButton } from './CloseButton';
import { CopyJsonButton } from './CopyJsonButton';

interface PanelHeaderProps {
    icon?: ReactNode;
    title: string|ReactNode;
    subtitle?: ReactNode;
    onClose: () => void;
    // The node the panel shows: with the debug preference on, a button copies it as JSON.
    debugNode?: unknown;
}

export function PanelHeader({ icon, title, subtitle, onClose, debugNode }: PanelHeaderProps) {
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
                {debugNode === undefined ? null : <CopyJsonButton node={debugNode} />}
                <CloseButton onClick={onClose} />
            </div>
        </header>
    );
}
