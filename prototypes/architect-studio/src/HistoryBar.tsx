import { Icon } from '../../../src/ui/common/Icon.tsx';
import { IconButton } from '../../../src/ui/common/IconButton.tsx';
import { t } from './i18n.ts';

interface HistoryBarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

// Floats over the 3D view, within reach of the thumb.
export function HistoryBar({ canUndo, canRedo, onUndo, onRedo }: HistoryBarProps) {
  return (
    <div className="studio-floating">
      <IconButton label={t('architect.undo')} title="Ctrl/Cmd+Z" disabled={!canUndo} onClick={onUndo}>
        <Icon name="rotateLeft" />
      </IconButton>
      <IconButton label={t('architect.redo')} title="Ctrl/Cmd+Shift+Z" disabled={!canRedo} onClick={onRedo}>
        <Icon name="rotateRight" />
      </IconButton>
    </div>
  );
}
