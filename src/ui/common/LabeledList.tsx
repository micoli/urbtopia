import { HTMLAttributes } from 'react';
import { LabeledListRow } from './LabeledListRow';

function LabeledListRoot(props: HTMLAttributes<HTMLDListElement>) {
    return <dl {...props} />;
}

export const LabeledList = Object.assign(LabeledListRoot, { Row: LabeledListRow });
