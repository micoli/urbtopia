import { Toast } from '../../../src/ui/system/Toast';
import { simGameAt } from './games';
import { SimGamePage } from './SimGamePage';
import { SimHome } from './SimHome';
import { useLocation } from './useLocation';

export function Sim() {
  const { pathname, search } = useLocation();
  const entry = simGameAt(pathname);
  const tier = Number(new URLSearchParams(search).get('tier')) || 1;
  return (
    <>
      {entry ? <SimGamePage key={entry.game} entry={entry} initialTier={tier} /> : <SimHome />}
      <Toast />
    </>
  );
}
