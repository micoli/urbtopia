import type { NavAction } from './useNavActions';
import { Icon } from '../common/Icon';

interface NavIconProps {
  action: Pick<NavAction, 'icon' | 'image'>;
}

export function NavIcon({ action }: NavIconProps) {
  if (!action.image) return <Icon name={action.icon} />;
  return <img className="nav-icon" src={`${import.meta.env.BASE_URL}assets/icons/${action.image}`} alt="" draggable={false} />;
}
