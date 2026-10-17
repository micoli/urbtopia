import { Note } from './Note';

interface BlockedReasonProps {
  reason: string | null;
}

export function BlockedReason({ reason }: BlockedReasonProps) {
  if (reason === null) return null;
  return <Note tone="muted">{reason}</Note>;
}
