import type { ReactNode } from 'react';
import { t } from '../../i18n/t';
import { CloseButton } from '../common/CloseButton';

interface DistrictCloseButtonProps {
  onClick: () => void;
  // What stands to the left of the cross.
  children?: ReactNode;
}

// A cross in the top right corner of the window, with the buttons that go beside it.
export function DistrictCloseButton({ onClick, children }: DistrictCloseButtonProps) {
  return (
    <div className="district-close">
      {children}
      <CloseButton label={t('district.close')} onClick={onClick} />
    </div>
  );
}
