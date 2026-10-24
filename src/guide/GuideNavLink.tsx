import { hrefOf, type GuideRoute } from './routes';

interface GuideNavLinkProps {
  route: GuideRoute;
  path: string;
  children: string;
}

export function GuideNavLink({ route, path, children }: GuideNavLinkProps) {
  return <a className="guide-nav-link" href={hrefOf(route, path)} aria-current={path === route.path ? 'page' : undefined}>{children}</a>;
}
