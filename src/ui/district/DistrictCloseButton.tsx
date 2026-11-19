import { t } from '../../i18n/t';
import { CloseButton } from '../common/CloseButton';

interface DistrictCloseButtonProps {
  onClick: () => void;
}

// A cross in the top right corner of the window.
export function DistrictCloseButton({ onClick }: DistrictCloseButtonProps) {
  return (
    <div className="district-close">
      <CloseButton label={t('district.close')} onClick={onClick} />
    </div>
  );
}
