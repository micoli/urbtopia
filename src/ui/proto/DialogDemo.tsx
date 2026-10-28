import { useState } from 'react';
import { Button } from './Button';
import { Dialog } from './Dialog';

export function DialogDemo() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Dialog open={open} onOpenChange={setOpen} title="Demolish this building?" description="The building and its contents are lost." actions={<><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="danger" onClick={() => setOpen(false)}>Demolish</Button></>} />
    </>
  );
}
