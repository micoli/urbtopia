import { AdvisorDialog } from './AdvisorDialog';
import { useAdvisor } from './useAdvisor';

export function AdvisorWindow() {
  const open = useAdvisor((store) => store.windowOpen);
  if (!open) return null;
  return <AdvisorDialog />;
}
