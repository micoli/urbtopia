interface StatChipProps {
    icon: string;
    value: string | number;
    title: string;
    tone?: 'normal' | 'warning' | 'critical';
    labelled?: boolean;
}

export function StatChip({ icon, value, title, tone, labelled = false }: StatChipProps) {
    return (
        <div title={title} aria-label={labelled ? title : undefined} className={tone && `utility-${tone}`}>
            {icon} {value}
        </div>
    );
}
