import { useEffect } from 'react';
import { useStore } from 'zustand';
import { bugReportInboxStore } from '../../bugReports/bugReportInboxStore';
import { cloudStore } from '../../store/cloudStore';
import { useBetaSubscribed } from './useBetaSubscribed';

const POLL_INTERVAL_MS = 120_000;

export function useBugReportInboxPolling(): void {
  const enabled = useStore(cloudStore, (store) => store.enabled);
  const subscribed = useBetaSubscribed();
  const hasEmail = useStore(cloudStore, (store) => store.account?.email != null);
  useEffect(() => {
    if (!subscribed || !enabled || !hasEmail) return;
    void bugReportInboxStore.getState().refresh();
    const timer = window.setInterval(() => void bugReportInboxStore.getState().refresh(), POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [subscribed, enabled, hasEmail]);
}
