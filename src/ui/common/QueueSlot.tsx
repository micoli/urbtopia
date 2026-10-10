import { ReactNode } from 'react';
import { progressColor } from './progressColor';

interface QueueSlotProps {
    status?: 'ready' | 'free';
    // From 0 to 1: tints the background from red to green.
    progress?: number;
    children: ReactNode;
}

export function QueueSlot({ status, progress, children }: QueueSlotProps) {
    const className = status ? `slot slot-${status}` : 'slot';
    const style = progress === undefined ? undefined : { background: progressColor(progress) };
    return <li className={className} style={style}>{children}</li>;
}
