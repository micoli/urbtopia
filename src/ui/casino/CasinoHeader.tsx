import { CasinoLedger } from './CasinoLedger.tsx';
import { StakePicker } from './StakePicker.tsx';

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
  return (
    <header className="casino-header">
      <CasinoLedger spent={spent} won={won} />
      <StakePicker steps={steps} urbs={urbs} value={stake} disabled={locked} onChange={onStake} />
    </header>
  );
}
