import * as RadixDialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import './tailwind.css';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  actions: ReactNode;
  column?: boolean;
}

export function Dialog({ open, onOpenChange, title, description, children, actions, column = false }: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-30 bg-ui-overlay backdrop-blur-sm" />
        <RadixDialog.Content className="fixed top-1/2 left-1/2 z-30 flex w-[min(360px,90vw)] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 rounded-ui-2xl border border-ui-edge bg-ui-surface p-4 text-ui-text shadow-ui-lg backdrop-blur-xl outline-none">
          <RadixDialog.Title className="m-0 text-lg font-semibold">{title}</RadixDialog.Title>
          {description ? <RadixDialog.Description className="m-0 text-sm opacity-75">{description}</RadixDialog.Description> : null}
          {children}
          <div className={column ? 'flex flex-col gap-2' : 'flex justify-end gap-2'}>{actions}</div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
