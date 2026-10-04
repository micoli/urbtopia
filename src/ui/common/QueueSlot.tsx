import { ReactNode } from 'react';

interface QueueSlotProps {
    status?: 'ready' | 'free';
    children: ReactNode;
}

export function QueueSlot({ status, children }: QueueSlotProps) {
    const className = status ? `slot slot-${status}` : 'slot';
    return <li className={className}>{children}</li>;
}
