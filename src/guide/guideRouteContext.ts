import { createContext, useContext } from 'react';
import type { GuideRoute } from './routes';

export const GuideRouteContext = createContext<GuideRoute | null>(null);

export function useGuideRoute(): GuideRoute {
  const route = useContext(GuideRouteContext);
  if (!route) throw new Error('useGuideRoute needs a GuideRouteContext');
  return route;
}
