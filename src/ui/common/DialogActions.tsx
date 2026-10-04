import { ReactNode } from 'react';

export interface DialogActionsProps {
    align?: 'start' | 'end' | 'stretch';
    column?: boolean;
    children: ReactNode;
}

export function DialogActions(_props: DialogActionsProps) {
    return null;
}
DialogActions.displayName = 'Dialog.Actions';
