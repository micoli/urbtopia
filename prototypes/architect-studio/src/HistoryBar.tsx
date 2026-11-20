interface HistoryBarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function HistoryBar({ canUndo, canRedo, onUndo, onRedo }: HistoryBarProps) {
  return (
    <div className="save-row">
      <button className="chip" disabled={!canUndo} title="Ctrl/Cmd+Z" onClick={onUndo}>
        ↶ Annuler
      </button>
      <button className="chip" disabled={!canRedo} title="Ctrl/Cmd+Shift+Z" onClick={onRedo}>
        Rétablir ↷
      </button>
    </div>
  );
}
