import { useStore } from 'zustand';
import { backOfficeStore } from '../../store/backOfficeStore';
import { OverlayBanner } from '../common/OverlayBanner';

export function BackOfficeBanner() {
  const loaded = useStore(backOfficeStore, (store) => store.loaded);
  if (!loaded) return null;

  const message = loaded.report
    ? `Back office: City of bug report ${loaded.revision}, read-only. Nothing is saved.`
    : `Back office: save of ${loaded.handle ?? 'an account without Handle'}, revision ${loaded.revision}. Cloud save is off.`;
  return (
    <OverlayBanner variant="banner" role="alert" message={message}>
      {null}
    </OverlayBanner>
  );
}
