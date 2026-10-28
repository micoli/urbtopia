import * as RadixDialog from '@radix-ui/react-dialog';
import { ReactNode } from 'react';
import { t } from '../../i18n/t';
import { ButtonRow } from './ButtonRow';
import { DialogActions } from './DialogActions';
import { DialogBody } from './DialogBody';
import { DialogTitle } from './DialogTitle';
import { findByType } from './findByType';
import './tailwind.css';

interface DialogRootProps {
    role?: 'dialog' | 'alertdialog';
    className?: string;
    children: ReactNode;
}

// Always open: the parent mounts it while it applies. Only its own buttons close it, never Escape or a click outside.
function DialogRoot({ role = 'dialog', className, children }: DialogRootProps) {
    const title = findByType(children, DialogTitle);
    const body = findByType(children, DialogBody);
    const actions = findByType(children, DialogActions);
    const backdropClass = ['dialog-backdrop', className].filter(Boolean).join(' ');
    return (
        <RadixDialog.Root open>
            <RadixDialog.Overlay className={backdropClass}>
                <RadixDialog.Content
                    className="dialog"
                    role={role}
                    aria-modal="true"
                    aria-describedby={undefined}
                    onEscapeKeyDown={(event) => event.preventDefault()}
                    onPointerDownOutside={(event) => event.preventDefault()}
                    onInteractOutside={(event) => event.preventDefault()}
                >
                    {title
                        ? <RadixDialog.Title asChild><h2>{title.props.children}</h2></RadixDialog.Title>
                        : <RadixDialog.Title className="sr-only">{t('dialog.untitled')}</RadixDialog.Title>}
                    {body?.props.children}
                    {actions && (
                        <ButtonRow align={actions.props.align ?? 'end'} column={actions.props.column}>
                            {actions.props.children}
                        </ButtonRow>
                    )}
                </RadixDialog.Content>
            </RadixDialog.Overlay>
        </RadixDialog.Root>
    );
}

export const Dialog = Object.assign(DialogRoot, {
    Title: DialogTitle,
    Body: DialogBody,
    Actions: DialogActions,
});
