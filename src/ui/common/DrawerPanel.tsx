import { ReactNode } from 'react';
import { DrawerPanelLabelValue } from './DrawerPanelLabelValue';
import { DrawerPanelTitle } from './DrawerPanelTitle';
import { UpgradeSection } from './UpgradeSection';

function DrawerPanelRoot({ children }: { children?: ReactNode }) {
    return <section className="production">{children}</section>;
}

export const DrawerPanel = Object.assign(DrawerPanelRoot, {
    Title: DrawerPanelTitle,
    LabelValue: DrawerPanelLabelValue,
    Upgrade: UpgradeSection,
});
