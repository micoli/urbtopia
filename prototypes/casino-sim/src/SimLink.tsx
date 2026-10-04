import type { ReactNode } from 'react';
import { navigate } from './useLocation';

interface SimLinkProps {
  to: string;
  children: ReactNode;
}

export function SimLink({ to, children }: SimLinkProps) {
  return (
    <a href={to} className="sim-link" onClick={event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      navigate(to);
    }}>
      {children}
    </a>
  );
}
