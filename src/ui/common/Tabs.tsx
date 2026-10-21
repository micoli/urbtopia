import { KeyboardEvent, ReactNode } from 'react';
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

export function Tabs<T extends string>({label, idPrefix, panelId, tabs, selected, onSelect}: TabsProps<T>) {
    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
        if (step === 0) return;
        event.preventDefault();
        const current = tabs.findIndex(tab => tab.id === selected);
        const next = (current + step + tabs.length) % tabs.length;
        const target = tabs[next];
        if (!target) return;
        onSelect(target.id);
        event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus();
    };
    return (
        <div className="tabs" role="tablist" aria-label={label} onKeyDown={onKeyDown}>
            {tabs.map(tab => (
                <button key={tab.id} type="button" role="tab" className="tabs-tab" id={`${idPrefix}-${tab.id}`} aria-selected={tab.id === selected} aria-controls={panelId} tabIndex={tab.id === selected ? 0 : -1} onClick={() => onSelect(tab.id)}>
                    {tab.label}
                    <CountBadge count={tab.count ?? 0}/>
                </button>
            ))}
        </div>
    );
}
