import { useStore } from 'zustand';
import { t } from '../../i18n/t';
import { prefsStore } from '../../i18n/prefsStore';
import { formatDay } from '../../i18n/formatDay';
import { annualEventNoticeStore } from '../../store/annualEventNoticeStore';
import { uiStore } from '../../store/uiStore';
import { useGame, useReadOnly } from '../common/hooks';
import { useNow } from '../common/useNow';
import { writeBuildSection } from '../build/buildMenuSections';
import { AnnualEventNoticeBanner } from './AnnualEventNoticeBanner';
import { nextAnnualEventNotice } from './nextAnnualEventNotice';

export function AnnualEventNotice() {
  const now = useNow(60_000);
  const tutorialDone = useGame(store => store.state.tutorial === null);
  const readOnly = useReadOnly();
  const dismissed = useStore(annualEventNoticeStore, store => store.dismissed);
  const notice = tutorialDone && !readOnly ? nextAnnualEventNotice(now, dismissed) : undefined;
  if (!notice) return null;

  const see = () => {
    writeBuildSection('build.annualEvents');
    const ui = uiStore.getState();
    if (ui.flyout !== 'build') ui.openFlyout('build');
    annualEventNoticeStore.getState().dismiss(notice.key);
  };

  return (
    <AnnualEventNoticeBanner
      eventName={t(`annualEvent.${notice.eventId}`)}
      endDate={formatDay(notice.window.endDay, prefsStore.getState().language)}
      onSee={see}
      onDismiss={() => annualEventNoticeStore.getState().dismiss(notice.key)}
    />
  );
}
