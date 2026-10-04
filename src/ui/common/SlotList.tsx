import { ReactNode } from 'react';
import { QueueSlot } from './QueueSlot';

function SlotListRoot({ children }: { children: ReactNode }) {
    return <ol className="slots">{children}</ol>;
}

export const SlotList = Object.assign(SlotListRoot, { Slot: QueueSlot });
