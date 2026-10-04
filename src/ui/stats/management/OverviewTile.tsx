import type {ReactNode} from 'react';

interface OverviewTileProps {
    icon: string;
    warning?: boolean;
    title?: string;
    children: ReactNode;
}

export function OverviewTile({icon, warning, title, children}: OverviewTileProps) {
    return <div data-warning={warning} title={title}>
        <span aria-hidden="true">{icon}</span>
        <div>{children}</div>
    </div>;
}
