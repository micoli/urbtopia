import { t } from '../../i18n/t';
import { UrbsAmount } from '../common/UrbsAmount';

interface CasinoLedgerProps {
  spent: number;
  won: number;
}

export function CasinoLedger({ spent, won }: CasinoLedgerProps) {
  const balance = won - spent;
  return (
    <dl className="casino-ledger">
      <div><dt>{t('casino.spent')}</dt><dd><UrbsAmount value={spent} /></dd></div>
      <div><dt>{t('casino.earned')}</dt><dd><UrbsAmount value={won} /></dd></div>
      <div data-sign={Math.sign(balance)}><dt>{t('casino.balance')}</dt><dd>{balance > 0 ? '+' : ''}<UrbsAmount value={balance} /></dd></div>
    </dl>
  );
}
