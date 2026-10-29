import { List, Root, Trigger } from '@radix-ui/react-tabs';
import type { MouseEvent, ReactNode } from 'react';
import { CountBadge } from './CountBadge';

export interface TabItem<T extends string> {
    id: T;
    label: ReactNode;
    count?: number;
}

interface TabsProps<T extends string> {
    label: string;
    idPrefix: string;
    panelId: string;
    tabs: readonly TabItem<T>[];
    selected: T;
    onSelect: (id: T) => void;
}

// Radix selects on mouse down, and a panel that changes height recentres under the pointer before the click ends: the click would land on the backdrop and close the dialog.
const keepSelectionForClick = (event: MouseEvent<HTMLButtonElement>) => event.preventDefault();

// The panel stays with the caller (`id={panelId}`, `role="tabpanel"`), so the ids it references are fixed here.
export function Tabs<T extends string>({label, idPrefix, panelId, tabs, selected, onSelect}: TabsProps<T>) {
    return (
        <Root value={selected} onValueChange={value => onSelect(value as T)}>
            <List className="tabs" aria-label={label}>
                {tabs.map(tab => (
                    <Trigger key={tab.id} value={tab.id} className="tabs-tab" id={`${idPrefix}-${tab.id}`} aria-controls={panelId} onMouseDown={keepSelectionForClick} onClick={event => {
                        event.currentTarget.focus({focusVisible: false} as FocusOptions);
                        onSelect(tab.id);
                    }}>
                        {tab.label}
                        <CountBadge count={tab.count ?? 0}/>
                    </Trigger>
                ))}
            </List>
        </Root>
    );
}
