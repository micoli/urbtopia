import { GOODS, marketQuote, type GoodId } from '../core';
import { t } from '../i18n/t';
import { gameStore } from '../store/gameStore';
import { useGame, useUi } from './hooks';

export function MarketContent() {
  const toggle = useUi((store) => store.toggleMarket);
  const state = useGame((store) => store.state);
  const goods = (Object.keys(GOODS) as GoodId[]).filter((good) => (state.storage.goods[good] ?? 0) > 0);
  const send = gameStore.getState().send;

  return (
    <>
      <header className="side-panel-header">
        <h2>{t('market.title')}</h2>
        <button type="button" className="panel-close" aria-label={t('panel.close')} onClick={toggle}>
          ✗
        </button>
      </header>
      {goods.length === 0 ? <p>{t('market.empty')}</p> : null}
      <ul className="market-list">
        {goods.map((good) => {
          const amount = state.storage.goods[good] ?? 0;
          const one = marketQuote(state, good, 1, state.lastSeen).total;
          const all = marketQuote(state, good, amount, state.lastSeen).total;
          return (
            <li key={good} className="market-row">
              <div>
                <strong>
                  {t(`item.${good}`)} × {amount}
                </strong>
                <div className="market-price">
                  {t('market.price')}: {one}
                </div>
              </div>
              <div className="market-actions">
                <button type="button" onClick={() => send({ type: 'SellToMarket', good, quantity: 1 })}>
                  {t('market.sellOne')} (+{one})
                </button>
                <button type="button" onClick={() => send({ type: 'SellToMarket', good, quantity: amount })}>
                  {t('market.sellAll')} (+{all})
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
