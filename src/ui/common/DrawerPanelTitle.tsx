interface DrawerPanelTitleProps {
    title: string;
    level: number;
}

export function DrawerPanelTitle({title, level}: DrawerPanelTitleProps) {
    return (
        <h3>
            <strong>{title}</strong> {level}
        </h3>
    );
}
