import { t } from '../../i18n/t';
import { UrbsAmount } from '../common/UrbsAmount';
import { LabeledList } from '../common/LabeledList';

interface CasinoLedgerProps {
  spent: number;
  won: number;
}

export function CasinoLedger({ spent, won }: CasinoLedgerProps) {
  const balance = won - spent;
  return (
    <LabeledList className="casino-ledger">
      <LabeledList.Row label={t('casino.spent')}><UrbsAmount value={spent} /></LabeledList.Row>
      <LabeledList.Row label={t('casino.earned')}><UrbsAmount value={won} /></LabeledList.Row>
      <LabeledList.Row data-sign={Math.sign(balance)} label={t('casino.balance')}>{balance > 0 ? '+' : ''}<UrbsAmount value={balance} /></LabeledList.Row>
    </LabeledList>
  );
}
