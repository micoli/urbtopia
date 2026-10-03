import { useUi } from './hooks';
import { CodexPanel } from './CodexPanel';

export function CodexDialog() {
  const open = useUi(store => store.codexOpen);
  if (!open) return null;
  return <CodexPanel />;
}
