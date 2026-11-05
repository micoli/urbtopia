import { Suspense, type ReactNode } from 'react';

export function OnDemand({ when, children }: { when: boolean; children: ReactNode }) {
  if (!when) return null;
  return <Suspense fallback={null}>{children}</Suspense>;
}
