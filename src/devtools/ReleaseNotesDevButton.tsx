import { useStore } from 'zustand';
import { releaseNotesStore } from '../store/releaseNotesStore';
import { ActionButton } from '../ui/common/ActionButton';

interface ReleaseNotesDevButtonProps {
  onDone: () => void;
}

// The Nouveautés window is modal and would leave the dev tools out of reach: they close first.
export function ReleaseNotesDevButton({ onDone }: ReleaseNotesDevButtonProps) {
  const lastSeenId = useStore(releaseNotesStore, store => store.lastSeenId);
  const forget = () => {
    releaseNotesStore.getState().forgetLastSeen();
    onDone();
  };
  return (
    <>
      <small>Dernière release lue : {lastSeenId ?? 'aucune'}</small>
      <ActionButton variant="danger" onClick={forget}>Effacer le tag de la dernière release</ActionButton>
      <small>Efface le tag mémorisé : la fenêtre Nouveautés se rouvre avec les 5 dernières notes.</small>
    </>
  );
}
