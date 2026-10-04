import { useContext } from 'react';
import { t } from '../../i18n/t.ts';
import { CasinoLedger } from './CasinoLedger.tsx';
import { StakePicker } from './StakePicker.tsx';
import { CasinoCloseContext } from './casinoCloseContext.ts';

interface CasinoHeaderProps {
  spent: number;
  won: number;
  steps: readonly number[];
  urbs: number;
  stake: number;
  locked?: boolean;
  onStake: (stake: number) => void;
}

export function CasinoHeader({ spent, won, steps, urbs, stake, locked = false, onStake }: CasinoHeaderProps) {
  const close = useContext(CasinoCloseContext);
  return (
    <header className="casino-header">
      <div className="casino-header-top">
        <CasinoLedger spent={spent} won={won} />
        {close ? <button type="button" className="panel-close" aria-label={t('casino.close')} onClick={close}>✗</button> : null}
      </div>
      <StakePicker steps={steps} urbs={urbs} value={stake} disabled={locked} onChange={onStake} />
    </header>
  );
}
