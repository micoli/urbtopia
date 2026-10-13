import { GOODS, MARKET, marketQuote, type GoodId } from '../../core';
import { itemName } from '../../i18n/itemName';
import { t } from '../../i18n/t';
import { useGame } from '../common/hooks';

const MINUTE_MS = 60_000;

export function MarketRulesPage() {
  const state = useGame((store) => store.state);
  const price = t('codex.market.price')
    .replace('{full}', String(MARKET.fullPoints))
    .replace('{loss}', String(MARKET.pointsLostPerUnit))
    .replace('{floor}', String(MARKET.floorPoints))
    .replace('{minutes}', String(MARKET.recoveryMs / MINUTE_MS));
  return (
    <>
      <h3 className="codex-entry-name">{t('codex.market.title')}</h3>
      <p>{t('codex.market.intro')}</p>
      <p>{price}</p>
      <p>{t('codex.market.tip')}</p>
      <h4>{t('codex.market.goods')}</h4>
      <div className="codex-economy-scroll">
        <table className="codex-economy">
          <thead>
            <tr>
              <th scope="col">{t('codex.market.good')}</th>
              <th scope="col">{t('codex.market.value')}</th>
              <th scope="col">{t('codex.market.now')}</th>
            </tr>
          </thead>
          <tbody>
            {(Object.keys(GOODS) as GoodId[]).map((good) => (
              <tr key={good}>
                <th scope="row">{itemName(good)}</th>
                <td>{GOODS[good].value}</td>
                <td>{marketQuote(state, good, 1, state.lastSeen).total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
