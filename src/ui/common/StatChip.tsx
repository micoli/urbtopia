import { Icon } from './Icon';
import type { IconName } from './iconRegistry';
interface StatChipProps {
    icon: IconName;
    value: string | number;
    title: string;
    tone?: 'normal' | 'warning' | 'critical';
    labelled?: boolean;
}

export function StatChip({ icon, value, title, tone, labelled = false }: StatChipProps) {
    return (
        <div title={title} aria-label={labelled ? title : undefined} className={tone && `utility-${tone}`}>
            <Icon name={icon} /> {value}
        </div>
    );
}
