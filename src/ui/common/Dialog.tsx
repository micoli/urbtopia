import { ReactNode } from 'react';
import { ButtonRow } from './ButtonRow';
import { DialogActions } from './DialogActions';
import { DialogBody } from './DialogBody';
import { DialogTitle } from './DialogTitle';
import { findByType } from './findByType';

interface DialogRootProps {
    role?: 'dialog' | 'alertdialog';
    className?: string;
    children: ReactNode;
}

function DialogRoot({ role = 'dialog', className, children }: DialogRootProps) {
    const title = findByType(children, DialogTitle);
    const body = findByType(children, DialogBody);
    const actions = findByType(children, DialogActions);
    const backdropClass = ['dialog-backdrop', className].filter(Boolean).join(' ');
    return (
        <div className={backdropClass} role={role} aria-modal="true">
            <div className="dialog">
                {title && <h2>{title.props.children}</h2>}
                {body?.props.children}
                {actions && (
                    <ButtonRow align={actions.props.align ?? 'end'} column={actions.props.column}>
                        {actions.props.children}
                    </ButtonRow>
                )}
            </div>
        </div>
    );
}

export const Dialog = Object.assign(DialogRoot, {
    Title: DialogTitle,
    Body: DialogBody,
    Actions: DialogActions,
});
