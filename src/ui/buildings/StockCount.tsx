import type { ReactNode } from 'react';

export function StockCount({ children }: { children: ReactNode }) {
  return <span className="stock-count">{children}</span>;
}
