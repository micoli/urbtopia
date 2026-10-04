import { t } from '../../i18n/t';
import { UrbsAmount } from '../common/UrbsAmount';

interface CasinoLedgerProps {
  spent: number;
  won: number;
  balance: number;
}

export function CasinoLedger({ spent, won, balance }: CasinoLedgerProps) {
  return (
    <dl className="casino-ledger">
      <div><dt>{t('casino.spent')}</dt><dd><UrbsAmount value={spent} /></dd></div>
      <div><dt>{t('casino.earned')}</dt><dd><UrbsAmount value={won} /></dd></div>
      <div><dt>{t('casino.balance')}</dt><dd><UrbsAmount value={balance} /></dd></div>
    </dl>
  );
}
