import type { NavAction } from './useNavActions';

interface NavIconProps {
  action: Pick<NavAction, 'icon' | 'image'>;
}

export function NavIcon({ action }: NavIconProps) {
  if (!action.image) return <>{action.icon}</>;
  return <img className="nav-icon" src={`${import.meta.env.BASE_URL}assets/icons/${action.image}`} alt="" draggable={false} />;
}
