import { useState } from 'react';
import { ActionButton } from '../common/ActionButton';
import { Dialog } from './Dialog';

export function DialogDemo() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <ActionButton onClick={() => setOpen(true)}>Open dialog</ActionButton>
      <Dialog open={open} onOpenChange={setOpen} title="Demolish this building?" description="The building and its contents are lost." actions={<><ActionButton onClick={() => setOpen(false)}>Cancel</ActionButton><ActionButton variant="danger" onClick={() => setOpen(false)}>Demolish</ActionButton></>} />
    </>
  );
}
