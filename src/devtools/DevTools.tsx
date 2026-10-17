import { useState } from 'react';
import { GOODS, MATERIALS } from '../core';
import { gameStore } from '../store/gameStore';
import { readOnlyStore } from '../store/readOnlyStore';
import { ActionButton } from '../ui/common/ActionButton';
import { useReadOnly } from '../ui/common/hooks';
import { giveAllItems, MAX_DEV_ITEM_QUANTITY } from './giveAllItems';
import './devtools.css';

export default function DevTools() {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState('1000');
  const [granted, setGranted] = useState<number | null>(null);
  const readOnly = useReadOnly();
  const amount = Number(quantity);
  const valid = Number.isSafeInteger(amount) && amount > 0 && amount <= MAX_DEV_ITEM_QUANTITY;

  const grant = () => {
    if (!valid || readOnlyStore.getState().readOnly) return;
    const store = gameStore.getState();
    store.replaceState(giveAllItems(store.state, amount), 'command');
    setGranted(amount);
  };

  return (
    <aside className="devtools" aria-label="Outils de développement">
      {open ? (
        <section id="devtools-panel" className="devtools-panel" aria-labelledby="devtools-title">
          <header>
            <strong id="devtools-title">Outils de développement</strong>
            <button type="button" className="devtools-close" aria-label="Fermer les outils de développement" onClick={() => setOpen(false)}>×</button>
          </header>
          <p>{Object.keys(MATERIALS).length} matériaux · {Object.keys(GOODS).length} biens</p>
          <label htmlFor="devtools-quantity">Quantité à ajouter par objet</label>
          <input id="devtools-quantity" type="number" min="1" max={MAX_DEV_ITEM_QUANTITY} step="1" value={quantity} onChange={(event) => { setQuantity(event.target.value); setGranted(null); }} />
          <ActionButton variant="primary" disabled={!valid || readOnly} onClick={grant}>Tout ajouter à l’entrepôt</ActionButton>
          <small>Inclut les objets verrouillés, sans limite de capacité.</small>
          {readOnly ? <p role="status">Cette partie est en lecture seule.</p> : granted !== null ? <p role="status">+{granted} de chaque matériau et bien ajoutés.</p> : null}
        </section>
      ) : null}
      <button type="button" className="devtools-trigger" aria-expanded={open} aria-controls={open ? 'devtools-panel' : undefined} onClick={() => setOpen(!open)}>DEV</button>
    </aside>
  );
}
