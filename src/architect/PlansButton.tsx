import { Icon } from '../ui/common/Icon.tsx';
import { IconButton } from '../ui/common/IconButton.tsx';
import { t } from '../i18n/t';

interface PlansButtonProps {
  onClick: () => void;
}

// Bottom-left of the 3D view: the way back to the plans, like the way back to the city in an interior.
export function PlansButton({ onClick }: PlansButtonProps) {
  return (
    <div className="studio-plans-button studio-floating">
      <IconButton label={t('architect.nav.plans')} onClick={onClick}>
        <Icon name="undo" />
      </IconButton>
    </div>
  );
}
