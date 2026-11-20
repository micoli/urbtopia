import { useState } from 'react';
import { ActionButton } from '../../../src/ui/common/ActionButton.tsx';
import { CurrencyText } from '../../../src/ui/common/CurrencyText.tsx';
import type { Hint } from './hints.ts';
import { t } from './i18n.ts';

const STORAGE_KEY = 'architect-studio:hints';

function readSeen(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

// Same look as the first-use hints of the game (`first-use-hint`, "Got it" button), floating at the top of the 3D view.
// Each hint is shown until it is dismissed, then never again.
export function ViewHint({ hint }: { hint?: Hint }) {
  const [seen, setSeen] = useState(readSeen);
  if (!hint || seen.includes(hint.id)) return null;
  const dismiss = () => {
    const next = [...seen, hint.id];
    setSeen(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // the hint only comes back on the next visit
    }
  };
  return (
    <aside className="first-use-hint studio-view-hint" data-hint={hint.id} role="status">
      <p>
        <CurrencyText text={hint.text} />
      </p>
      <ActionButton size="sm" onClick={dismiss}>
        {t('architect.hint.dismiss')}
      </ActionButton>
    </aside>
  );
}
