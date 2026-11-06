import { Suspense, type ReactNode } from 'react';
import { OnDemandErrorBoundary } from './OnDemandErrorBoundary';

export function OnDemand({ when, children }: { when: boolean; children: ReactNode }) {
  if (!when) return null;
  return (
    <OnDemandErrorBoundary>
      <Suspense fallback={null}>{children}</Suspense>
    </OnDemandErrorBoundary>
  );
}
