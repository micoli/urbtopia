import { ReactNode } from 'react';

interface NoteProps {
    tone?: 'warn' | 'muted';
    children: ReactNode;
}

export function Note({ tone = 'warn', children }: NoteProps) {
    return <p className={`note note--${tone}`}>{children}</p>;
}
