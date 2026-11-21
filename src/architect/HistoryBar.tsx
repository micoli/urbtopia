import { Icon } from '../ui/common/Icon.tsx';
import { IconButton } from '../ui/common/IconButton.tsx';
import { t } from '../i18n/t';

interface HistoryBarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClose?: () => void;
}

// Floats over the 3D view, within reach of the thumb.
export function HistoryBar({ canUndo, canRedo, onUndo, onRedo, onClose }: HistoryBarProps) {
  return (
    <div className="studio-floating">
      <IconButton label={t('architect.undo')} title="Ctrl/Cmd+Z" disabled={!canUndo} onClick={onUndo}>
        <Icon name="rotateLeft" />
      </IconButton>
      <IconButton label={t('architect.redo')} title="Ctrl/Cmd+Shift+Z" disabled={!canRedo} onClick={onRedo}>
        <Icon name="rotateRight" />
      </IconButton>
      {onClose && (
        <IconButton label={t('architect.close')} onClick={onClose}>
          <Icon name="close" />
        </IconButton>
      )}
    </div>
  );
}
