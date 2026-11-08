import { useEffect, useState } from 'react';
import { useStore } from 'zustand';
import { prefsStore } from '../../i18n/prefsStore';
import { hasUnseenNotes, notesOf } from '../../releaseNotes/unseenNotes';
import { isE2eRequested } from '../../store/e2eFlag';
import { releaseNotesStore } from '../../store/releaseNotesStore';
import { useGame, useReadOnly } from '../common/hooks';
import { ReleaseNotesDialog } from './ReleaseNotesDialog';
import { useSignInPromptOpen } from './useSignInPromptOpen';

export function ReleaseNotes() {
  const tutorialDone = useGame(store => store.state.tutorial === null);
  const readOnly = useReadOnly();
  const signInPromptOpen = useSignInPromptOpen();
  const releases = useStore(releaseNotesStore, store => store.releases);
  const lastSeenId = useStore(releaseNotesStore, store => store.lastSeenId);
  const reviewing = useStore(releaseNotesStore, store => store.reviewing);
  const language = useStore(prefsStore, store => store.language);
  const [index, setIndex] = useState(0);
  const e2e = isE2eRequested(window.location.search);

  useEffect(() => {
    if (e2e) return;
    void releaseNotesStore.getState().load();
  }, [e2e]);

  // Two modal dialogs cannot share the screen: the sign-in prompt comes first, the news right after it.
  const automatic = tutorialDone && !readOnly && !signInPromptOpen && !e2e && hasUnseenNotes(releases, lastSeenId);
  const notes = notesOf(releases);
  const newest = notes[0];
  if (!newest || !(reviewing || automatic)) return null;

  const close = () => {
    releaseNotesStore.getState().markSeen(newest.id);
    releaseNotesStore.getState().setReviewing(false);
    setIndex(0);
  };

  return <ReleaseNotesDialog notes={notes} index={index} language={language} onSelect={setIndex} onClose={close} />;
}
