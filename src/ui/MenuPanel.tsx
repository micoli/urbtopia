import { useState } from 'react';
import { saveSession } from '../persistence/instance';
import { t } from '../i18n/t';
import { gameStore } from '../store/gameStore';
import { useUi } from './hooks';

export function MenuPanel() {
  const open = useUi((store) => store.menuOpen);
  const toggle = useUi((store) => store.toggleMenu);
  const [confirming, setConfirming] = useState(false);
  if (!open) return null;

  const startNewGame = () => {
    saveSession.unlock();
    gameStore.getState().newGame(Date.now());
    setConfirming(false);
    toggle();
  };

  return (
    <aside className="market-panel">
      <header className="side-panel-header">
        <h2>{t('menu.title')}</h2>
        <button type="button" className="panel-close" aria-label={t('panel.close')} onClick={toggle}>
          ✗
        </button>
      </header>
      <div className="side-panel-actions">
        {confirming ? (
          <>
            <p>{t('menu.newGameConfirm')}</p>
            <button type="button" onClick={() => setConfirming(false)}>
              {t('sale.no')}
            </button>
            <button type="button" className="dialog-danger" onClick={startNewGame}>
              {t('menu.newGame')}
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setConfirming(true)}>
            {t('menu.newGame')}
          </button>
        )}
      </div>
    </aside>
  );
}
