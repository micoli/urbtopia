import { useState } from 'react';
import { useStore } from 'zustand';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { Icon } from './Icon';
import { IconButton } from './IconButton';

interface CopyJsonButtonProps {
  node: unknown;
}

const COPIED_MS = 1500;

// Debug only: copies the node a panel shows, as JSON, to the clipboard.
export function CopyJsonButton({ node }: CopyJsonButtonProps) {
  const debug = useStore(prefsStore, store => store.debug);
  const [copied, setCopied] = useState(false);
  if (!debug) return null;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(node, null, 2));
    } catch {
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), COPIED_MS);
  };
  return (
    <IconButton label={t('panel.copyJson')} title={t('panel.copyJson')} onClick={() => void copy()}>
      <Icon name={copied ? 'check' : 'bug'} />
    </IconButton>
  );
}
