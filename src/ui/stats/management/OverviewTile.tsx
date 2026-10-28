import type {ReactNode} from 'react';
import { Icon } from '../../common/Icon';
import type { IconName } from '../../common/iconRegistry';

interface OverviewTileProps {
    icon: IconName;
    warning?: boolean;
    title?: string;
    children: ReactNode;
}

export function OverviewTile({icon, warning, title, children}: OverviewTileProps) {
    return <div data-warning={warning} title={title}>
        <Icon name={icon} />
        <div>{children}</div>
    </div>;
}
