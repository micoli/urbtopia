import {ReactNode} from "react";

interface DrawerProductionPanelProps {
    children?: ReactNode;
}

export function DrawerProductionPanel({ children }: DrawerProductionPanelProps) {
    return <section className="production">{children}</section>
}
